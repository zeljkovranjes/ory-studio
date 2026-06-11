/** Data-driven information architecture, mirroring docs/ory-console-extraction.md §2. */

export interface NavItem {
  label: string;
  href: string;
  /** Implemented in the current milestone; otherwise renders ComingSoon. */
  live?: boolean;
}

export interface NavSection {
  label: string;
  href: string;
  /** Path prefixes (besides href) that belong to this section. */
  match: string[];
  sidebar: NavItem[];
}

export const SECTIONS: NavSection[] = [
  {
    label: "Get started",
    href: "/get-started",
    match: ["/get-started"],
    sidebar: [],
  },
  {
    label: "Activity",
    href: "/activity",
    match: ["/activity", "/sessions", "/email-delivery"],
    sidebar: [
      { label: "Live", href: "/activity" },
      { label: "Logs & events", href: "/activity/events" },
      { label: "Sessions", href: "/sessions", live: true },
      { label: "Message delivery", href: "/email-delivery", live: true },
    ],
  },
  {
    label: "User management",
    href: "/identities",
    match: ["/identities", "/identity-schema"],
    sidebar: [
      { label: "Users & identities", href: "/identities", live: true },
      { label: "Identity schema", href: "/identity-schema" },
    ],
  },
  {
    label: "Authentication",
    href: "/authentication",
    match: [
      "/authentication",
      "/passwordless",
      "/mfa",
      "/social-signin",
      "/saml",
      "/email-configuration",
      "/sms-configuration",
      "/developers/actions",
    ],
    sidebar: [
      { label: "General", href: "/authentication", live: true },
      { label: "Passwordless login", href: "/passwordless" },
      { label: "Two-factor auth", href: "/mfa" },
      { label: "Social Sign-In (OIDC)", href: "/social-signin" },
      { label: "SAML Sign-In", href: "/saml" },
      { label: "Sessions", href: "/authentication/sessions" },
      { label: "Account recovery", href: "/authentication/recovery" },
      { label: "Account verification", href: "/authentication/verification" },
      { label: "Email Configuration", href: "/email-configuration" },
      { label: "SMS Configuration", href: "/sms-configuration" },
      { label: "Actions & Webhooks", href: "/developers/actions" },
    ],
  },
  {
    label: "Organizations",
    href: "/organizations",
    match: ["/organizations"],
    sidebar: [{ label: "All organizations", href: "/organizations" }],
  },
  {
    label: "OAuth 2",
    href: "/oauth",
    match: ["/oauth"],
    sidebar: [
      { label: "Clients and applications", href: "/oauth" },
      { label: "Endpoints", href: "/oauth/endpoints" },
      { label: "General", href: "/oauth/configure" },
      { label: "OpenID Connect", href: "/oauth/openid" },
      { label: "URLs", href: "/oauth/urls" },
      { label: "Lifespans", href: "/oauth/lifespans" },
      { label: "Token strategies", href: "/oauth/strategies" },
      { label: "Cookies", href: "/oauth/cookies" },
    ],
  },
  {
    label: "Permissions",
    href: "/permissions/configuration",
    match: ["/permissions"],
    sidebar: [
      { label: "Namespace & rules", href: "/permissions/configuration" },
      { label: "Relationships", href: "/permissions/relationships" },
    ],
  },
  {
    label: "Branding",
    href: "/account-experience/theming",
    match: [
      "/account-experience",
      "/custom-domains",
      "/browser-redirects",
      "/ui",
      "/email-templates",
    ],
    sidebar: [
      { label: "Theming", href: "/account-experience/theming" },
      { label: "Localization", href: "/account-experience/locales" },
      { label: "Custom domains", href: "/custom-domains" },
      { label: "Browser redirects", href: "/browser-redirects" },
      { label: "UI URLs", href: "/ui" },
      { label: "Email templates", href: "/email-templates" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    match: ["/settings", "/developers"],
    sidebar: [
      { label: "Overview", href: "/settings" },
      { label: "API Keys", href: "/settings/api-keys" },
      { label: "Event streams", href: "/settings/event-streams" },
      { label: "Members", href: "/settings/members" },
      { label: "Tenants", href: "/settings/tenants" },
      { label: "Advanced", href: "/settings/advanced" },
    ],
  },
];

export function sectionForPath(pathname: string): NavSection | undefined {
  return SECTIONS.find((section) =>
    section.match.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ),
  );
}
