import { Namespace, Context } from "@ory/keto-namespace-types"

// Default Ory Permission Language namespaces — edited via the studio's
// Permissions > Namespace & rules page.33

class User implements Namespace {}

class Organization implements Namespace {
  related: {
    members: User[]
    admins: User[]
  }

  permits = {
    view: (ctx: Context): boolean =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject),
    manage: (ctx: Context): boolean =>
      this.related.admins.includes(ctx.subject),
  }
}
