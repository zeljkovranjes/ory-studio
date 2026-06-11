/** Build identity traits from the create-identity form fields. */
export function buildTraits(input: {
  email: string;
  first?: string;
  last?: string;
  rawTraits?: string;
}): Record<string, unknown> {
  if (input.rawTraits?.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.rawTraits);
    } catch {
      throw new Error("Raw traits must be valid JSON");
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Raw traits must be a JSON object");
    }
    return parsed as Record<string, unknown>;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) {
    throw new Error("A valid email address is required");
  }
  const traits: Record<string, unknown> = { email: input.email };
  if (input.first || input.last) {
    traits.name = {
      ...(input.first ? { first: input.first } : {}),
      ...(input.last ? { last: input.last } : {}),
    };
  }
  return traits;
}
