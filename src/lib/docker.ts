/**
 * Minimal Docker Engine API client over the local socket — used by the config
 * engine to reload service containers after writing config. Works on Linux
 * (unix socket, the path mounted into the studio container) and on Windows
 * dev boxes (Docker Desktop named pipe).
 */

import { Agent, request } from "undici";

const SOCKET_CANDIDATES =
  process.platform === "win32"
    ? ["\\\\.\\pipe\\docker_engine"]
    : ["/var/run/docker.sock"];

function agentFor(socketPath: string): Agent {
  return new Agent({ connect: { socketPath } });
}

interface ContainerSummary {
  Id: string;
  Names: string[];
  State: string;
}

async function dockerGet<T>(path: string): Promise<T> {
  let lastError: Error | undefined;
  for (const socketPath of SOCKET_CANDIDATES) {
    try {
      const res = await request(`http://docker${path}`, {
        dispatcher: agentFor(socketPath),
      });
      if (res.statusCode >= 400) {
        throw new Error(`Docker API ${res.statusCode} for ${path}`);
      }
      return (await res.body.json()) as T;
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw lastError ?? new Error("Docker socket not reachable");
}

async function dockerPost(path: string): Promise<void> {
  let lastError: Error | undefined;
  for (const socketPath of SOCKET_CANDIDATES) {
    try {
      const res = await request(`http://docker${path}`, {
        method: "POST",
        dispatcher: agentFor(socketPath),
      });
      await res.body.dump();
      if (res.statusCode >= 400) {
        throw new Error(`Docker API ${res.statusCode} for ${path}`);
      }
      return;
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw lastError ?? new Error("Docker socket not reachable");
}

/** Find containers belonging to a compose service (e.g. "kratos"). */
export async function findServiceContainers(
  service: string,
): Promise<ContainerSummary[]> {
  const filters = encodeURIComponent(
    JSON.stringify({ label: [`com.docker.compose.service=${service}`] }),
  );
  return dockerGet<ContainerSummary[]>(`/containers/json?filters=${filters}`);
}

/**
 * Restart all containers of a compose service so they pick up new config.
 * Returns a human-readable status; throws only on unexpected API errors.
 */
export async function restartService(
  service: string,
): Promise<{ restarted: number }> {
  const containers = await findServiceContainers(service);
  for (const container of containers) {
    await dockerPost(`/containers/${container.Id}/restart?t=2`);
  }
  return { restarted: containers.length };
}
