/**
 * Lightweight Ory Permission Language (OPL) validator. OPL is a constrained
 * TypeScript dialect; full type-checking happens in Keto on save. This catches
 * the common authoring mistakes early and powers inline editor diagnostics.
 */

export interface OplDiagnostic {
  /** 0-based offset into the source where the problem is. */
  from: number;
  to: number;
  message: string;
  severity: "error" | "warning";
}

const OPENERS: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
const CLOSERS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

/**
 * Scan for unbalanced brackets and the presence of a Namespace class.
 * String/line-comment/block-comment contents are skipped so braces inside
 * them don't trip the balance check.
 */
export function validateOpl(source: string): OplDiagnostic[] {
  const diagnostics: OplDiagnostic[] = [];
  const stack: { ch: string; pos: number }[] = [];

  let i = 0;
  const n = source.length;
  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];

    // line comment
    if (ch === "/" && next === "/") {
      i += 2;
      while (i < n && source[i] !== "\n") i++;
      continue;
    }
    // block comment
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    // strings / template literals
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < n && source[i] !== quote) {
        if (source[i] === "\\") i++; // skip escaped char
        i++;
      }
      i++;
      continue;
    }

    if (ch in OPENERS) {
      stack.push({ ch, pos: i });
    } else if (ch in CLOSERS) {
      const top = stack.pop();
      if (!top) {
        diagnostics.push({
          from: i,
          to: i + 1,
          message: `Unexpected closing "${ch}"`,
          severity: "error",
        });
      } else if (OPENERS[top.ch] !== ch) {
        diagnostics.push({
          from: i,
          to: i + 1,
          message: `Mismatched "${ch}" — expected "${OPENERS[top.ch]}"`,
          severity: "error",
        });
      }
    }
    i++;
  }

  for (const unclosed of stack) {
    diagnostics.push({
      from: unclosed.pos,
      to: unclosed.pos + 1,
      message: `Unclosed "${unclosed.ch}"`,
      severity: "error",
    });
  }

  if (!/class\s+[A-Za-z_]\w*\s+implements\s+Namespace/.test(source)) {
    diagnostics.push({
      from: 0,
      to: Math.min(source.length, 1),
      message:
        "OPL must define at least one namespace: `class X implements Namespace {}`",
      severity: "error",
    });
  }

  // Style nudge: namespaces should be UpperCamelCase singular nouns.
  for (const m of source.matchAll(
    /class\s+([A-Za-z_]\w*)\s+implements\s+Namespace/g,
  )) {
    const name = m[1];
    if (!/^[A-Z]/.test(name)) {
      const at = (m.index ?? 0) + m[0].indexOf(name);
      diagnostics.push({
        from: at,
        to: at + name.length,
        message: `Namespace "${name}" should be UpperCamelCase (e.g. ${name[0].toUpperCase() + name.slice(1)})`,
        severity: "warning",
      });
    }
  }

  return diagnostics;
}

/** True when there are no error-severity diagnostics. */
export function isValidOpl(source: string): boolean {
  return !validateOpl(source).some((d) => d.severity === "error");
}

/** First error message, for surfacing in a server response. */
export function firstOplError(source: string): string | null {
  const err = validateOpl(source).find((d) => d.severity === "error");
  return err ? err.message : null;
}
