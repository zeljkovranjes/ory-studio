import { describe, expect, it } from "vitest";
import { CLIENT_TEMPLATES, clientTemplate } from "@/lib/oauth-templates";

describe("client templates", () => {
  it("has the four console templates", () => {
    expect(CLIENT_TEMPLATES.map((t) => t.key)).toEqual([
      "server",
      "m2m",
      "spa",
      "custom",
    ]);
  });

  it("machine-to-machine uses client_credentials and no response types", () => {
    const m2m = clientTemplate("m2m")!;
    expect(m2m.grant_types).toEqual(["client_credentials"]);
    expect(m2m.response_types).toEqual([]);
  });

  it("single-page apps are public clients (no auth method)", () => {
    expect(clientTemplate("spa")!.token_endpoint_auth_method).toBe("none");
  });

  it("server apps use the auth-code + refresh flow with basic auth", () => {
    const server = clientTemplate("server")!;
    expect(server.grant_types).toContain("authorization_code");
    expect(server.grant_types).toContain("refresh_token");
    expect(server.token_endpoint_auth_method).toBe("client_secret_basic");
  });

  it("returns undefined for an unknown key", () => {
    expect(clientTemplate("nope")).toBeUndefined();
  });
});
