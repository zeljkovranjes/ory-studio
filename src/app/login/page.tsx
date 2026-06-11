import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/identities";

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-accent text-sm font-bold text-fg-on-accent">
            O
          </span>
          <span className="text-base font-semibold">ory-studio</span>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <h1 className="text-base font-medium">Sign in</h1>
          <p className="mt-1 mb-5 text-sm text-fg-muted">
            Enter the studio administrator password to continue.
          </p>
          <LoginForm next={safeNext} />
        </div>
      </div>
    </div>
  );
}
