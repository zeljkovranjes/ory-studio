import Link from "next/link";
import { readFile } from "fs/promises";
import { listRelationships, namespacesFromOpl } from "@/lib/keto";
import { currentTenant } from "@/lib/tenant";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
import { Flash, SaveButton, TextField } from "@/components/forms";
import { addRelationship, removeRelationship } from "./actions";

export const dynamic = "force-dynamic";

export default async function RelationshipsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    warning?: string;
    error?: string;
    subject?: string;
    namespace?: string;
    page_token?: string;
  }>;
}) {
  const { subject, namespace, page_token, ...flash } = await searchParams;
  const tenant = await currentTenant();

  let namespaces: string[] = [];
  try {
    const oplPath =
      process.env.KETO_NAMESPACES_PATH ?? "./config/keto/namespaces.keto.ts";
    namespaces = namespacesFromOpl(await readFile(oplPath, "utf8"));
  } catch {
    // OPL file unavailable — namespace listing is best-effort
  }

  // The read API requires a namespace filter; query each known namespace
  // unless one was selected explicitly.
  const queryNamespaces = namespace ? [namespace] : namespaces;
  const pages = await Promise.all(
    queryNamespaces.map((ns) =>
      listRelationships(tenant, {
        namespace: ns,
        subjectId: subject || undefined,
        pageToken: page_token,
      }),
    ),
  );
  const items = pages.flatMap((page) => page.items);
  const firstError = pages.find((page) => page.error)?.error;

  return (
    <>
      <PageHeader
        title="Relationships"
        description="Relationships are the underlying data of Ory Permissions — they encode relations between subjects and objects, e.g. 'user X is in admins of Organization Y'."
      />
      <Flash {...flash} />

      <Card title="Search">
        <form className="flex flex-wrap items-end gap-3" action="/permissions/relationships">
          <label className="text-sm">
            <span className="font-medium">Subject</span>
            <input
              name="subject"
              defaultValue={subject}
              placeholder="user id…"
              className="mt-1 block h-8 w-72 rounded border border-border px-2 font-mono text-xs text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Namespace</span>
            <select
              name="namespace"
              defaultValue={namespace ?? ""}
              className="mt-1 block h-8 w-44 rounded border border-border bg-surface px-2 text-sm text-input-text focus:border-accent focus:outline-none"
            >
              <option value="">All namespaces</option>
              {namespaces.map((ns) => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-8 rounded bg-accent px-3 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
          >
            Search
          </button>
        </form>
      </Card>

      <Card title="Relation tuples">
        {firstError ? (
          <ErrorState message={`Could not reach Keto: ${firstError}`} />
        ) : items.length === 0 ? (
          <EmptyState message="No relationships found. Add one below." />
        ) : (
          <Table headers={["Subject", "Relation", "Object", ""]}>
            {items.map((tuple, index) => (
              <tr
                key={`${tuple.namespace}-${tuple.object}-${tuple.relation}-${tuple.subject_id}-${index}`}
                className="hover:bg-canvas"
              >
                <td className="px-3 py-2 font-mono text-xs">
                  {tuple.subject_id ??
                    `${tuple.subject_set?.namespace}:${tuple.subject_set?.object}#${tuple.subject_set?.relation}`}
                </td>
                <td className="px-3 py-2">
                  <span className="text-fg-muted">is in</span>{" "}
                  <span className="font-medium">{tuple.relation}</span>{" "}
                  <span className="text-fg-muted">of</span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium">{tuple.namespace}</span>{" "}
                  <span className="font-mono text-xs text-fg-muted">
                    {tuple.object}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {tuple.subject_id ? (
                    <form action={removeRelationship}>
                      <input type="hidden" name="namespace" value={tuple.namespace} />
                      <input type="hidden" name="object" value={tuple.object} />
                      <input type="hidden" name="relation" value={tuple.relation} />
                      <input type="hidden" name="subject_id" value={tuple.subject_id} />
                      <button
                        type="submit"
                        className="text-sm text-error hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {pages.some((page) => page.nextPageToken) && namespace ? (
          <div className="mt-4 text-right">
            <Link
              href={`/permissions/relationships?${new URLSearchParams({
                namespace,
                ...(subject ? { subject } : {}),
                page_token: pages[0].nextPageToken ?? "",
              })}`}
              className="text-sm text-accent hover:underline"
            >
              Next page →
            </Link>
          </div>
        ) : null}
      </Card>

      <Card
        title="Add relationship"
        description="Creates a relation tuple via the Keto write API."
      >
        <form action={addRelationship}>
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="font-medium">Namespace</span>
              <select
                name="namespace"
                className="mt-1 block h-8 w-44 rounded border border-border bg-surface px-2 text-sm text-input-text focus:border-accent focus:outline-none"
              >
                {namespaces.map((ns) => (
                  <option key={ns} value={ns}>
                    {ns}
                  </option>
                ))}
              </select>
            </label>
            <TextField name="object" label="Object" mono />
            <TextField name="relation" label="Relation" placeholder="members" mono />
            <TextField name="subject_id" label="Subject" placeholder="user id…" mono />
          </div>
          <SaveButton label="Add relationship" />
        </form>
      </Card>
    </>
  );
}
