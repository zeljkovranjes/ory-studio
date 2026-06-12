/** Human label for a Kratos Authenticator Assurance Level. */
export function aalLabel(aal: string | undefined): string {
  switch (aal) {
    case "aal1":
      return "AAL1 · single-factor";
    case "aal2":
      return "AAL2 · two-factor";
    case "aal3":
      return "AAL3 · hardware-backed";
    case "aal0":
      return "AAL0 · no credential";
    default:
      return aal || "unknown";
  }
}
