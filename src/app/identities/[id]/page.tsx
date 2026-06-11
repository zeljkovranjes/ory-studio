import Link from "next/link";
import {
  getIdentity,
  identityIdentifier,
  listIdentitySessions,
} from "@/lib/kratos";
import { listRelationships } from "@/lib/keto";
import { getOrganization, ORG_NAMESPACE } from "@/lib/organizations";
import { summarizeCredentials } from "@/lib/credentials";
import { currentTenant } from "@/lib/tenant";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
import { Flash } from "@/components/forms";
import { RecoveryCode } from "./RecoveryCode";
import {
  deleteIdentityAction,
  revokeSessionsAction,
  setIdentityStateAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function IdentityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const tenant = await currentTenant();

  let identity;
  try {
    identity = await getIdentity(tenant, id);
  } catch (err) {
    return (
      <Card>
        <ErrorState message={(err as Error).message} />
      </Card>
    );
  }
  const sessions = await listIdentitySessions(tenant, id);
  const credentials = summarizeCredentials(identity);

  // Organization memberships: Keto relationships in the Organization namespace
  // where this identity is the subject. Resolve each org's name from the DB.
  const orgRel = await listRelationships(tenant, {
    namespace: ORG_NAMESPACE,
    subjectId: identity.id,
  });
  const memberships = (
    await Promise.all(
      orgRel.items
        .filter((t) => t.object?.startsWith("org:"))
        .map(async (t) => {
          const orgId = t.object.slice("org:".length);
          const org = await getOrganization(tenant.id, orgId).catch(() => null);
          return org
            ? { id: org.id, name: org.name, relation: t.relation }
            : null;
        }),
    )
  ).filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <>
      <PageHeader
        title={identityIdentifier(identity)}
        description={`Identity ${identity.id}`}
      />
      <Flash {...flash} />

      <Card title="Overview">
        <dl className="grid max-w-2xl grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-fg-muted">State</dt>
          <dd className="flex items-center gap-3">
            <Badge tone={identity.state === "active" ? "success" : "muted"}>
              {identity.state}
            </Badge>
            <form action={setIdentityStateAction}>
              <input type="hidden" name="id" value={identity.id} />
              <input
                type="hidden"
                name="state"
                value={identity.state === "active" ? "inactive" : "active"}
              />
              <button
                type="submit"
                className="rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg hover:bg-bg-subtle"
              >
                {identity.state === "active" ? "Deactivate" : "Activate"}
              </button>
            </form>
          </dd>
          <dt className="text-fg-muted">Schema</dt>
          <dd>{identity.schema_id}</dd>
          <dt className="text-fg-muted">Created</dt>
          <dd>{new Date(identity.created_at).toLocaleString()}</dd>
          <dt className="text-fg-muted">Updated</dt>
          <dd>{new Date(identity.updated_at).toLocaleString()}</dd>
        </dl>
      </Card>

      <Card
        title="Credentials"
        description="Login methods this identity has configured. Secrets are never shown — Kratos redacts them."
      >
        {credentials.length === 0 ? (
          <EmptyState message="No credentials configured." />
        ) : (
          <Table headers={["Method", "Identifiers", "Added"]}>
            {credentials.map((cred) => (
              <tr key={cred.type}>
                <td className="px-3 py-2 font-medium">{cred.label}</td>
                <td className="px-3 py-2 text-fg-muted">
                  {cred.identifiers.length ? (
                    <span className="font-mono text-xs">
                      {cred.identifiers.join(", ")}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-fg-muted">
                  {cred.createdAt
                    ? new Date(cred.createdAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Addresses">
        {identity.verifiable_addresses?.length ? (
          <Table headers={["Address", "Via", "Verified"]}>
            {identity.verifiable_addresses.map((address) => (
              <tr key={address.value}>
                <td className="px-3 py-2 font-medium">{address.value}</td>
                <td className="px-3 py-2 text-fg-muted">{address.via}</td>
                <td className="px-3 py-2">
                  <Badge tone={address.verified ? "success" : "muted"}>
                    {address.verified ? "verified" : "unverified"}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState message="No verifiable addresses." />
        )}
      </Card>

      <Card
        title="Organizations"
        description="Organizations this identity belongs to, via Keto memberships."
      >
        {memberships.length === 0 ? (
          <EmptyState message="Not a member of any organization." />
        ) : (
          <Table headers={["Organization", "Role"]}>
            {memberships.map((m) => (
              <tr key={`${m.id}:${m.relation}`} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/organizations/${m.id}`}
                    className="hover:text-accent hover:underline"
                  >
                    {m.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={m.relation === "admins" ? "success" : "muted"}>
                    {m.relation === "admins" ? "admin" : "member"}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Traits">
        <pre className="overflow-x-auto rounded bg-canvas p-3 font-mono text-xs">
          {JSON.stringify(identity.traits, null, 2)}
        </pre>
      </Card>

      <Card
        title="Sessions"
        description="Active and historical sessions for this identity."
      >
        {sessions.length === 0 ? (
          <EmptyState message="No sessions." />
        ) : (
          <Table headers={["Active", "AAL", "Authenticated", "Expires"]}>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="px-3 py-2">
                  <Badge tone={session.active ? "success" : "muted"}>
                    {session.active ? "active" : "inactive"}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-fg-muted">
                  {session.authenticator_assurance_level}
                </td>
                <td className="px-3 py-2 text-fg-muted">
                  {new Date(session.authenticated_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-fg-muted">
                  {new Date(session.expires_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {sessions.length > 0 ? (
          <form action={revokeSessionsAction} className="mt-4">
            <input type="hidden" name="id" value={identity.id} />
            <button
              type="submit"
              className="h-8 rounded border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-bg-subtle"
            >
              Revoke all sessions
            </button>
          </form>
        ) : null}
      </Card>

      <Card
        title="Account recovery"
        description="Generate a one-time recovery code the user can redeem on the recovery page."
      >
        <RecoveryCode identityId={identity.id} />
      </Card>

      <Card
        title="Danger zone"
        description="Deleting an identity is irreversible and removes its credentials, addresses and sessions."
      >
        <form action={deleteIdentityAction}>
          <input type="hidden" name="id" value={identity.id} />
          <button
            type="submit"
            className="h-8 rounded bg-error-emphasis px-4 text-sm font-medium text-fg-on-accent hover:bg-error"
          >
            Delete identity permanently
          </button>
        </form>
      </Card>
    </>
  );
}
