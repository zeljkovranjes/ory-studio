"use client";

import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { validateOpl } from "@/lib/opl-validate";

/** CodeMirror-based OPL editor with live validation, submitted via a hidden field. */
export function OplEditor({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);

  const diagnostics = useMemo(() => validateOpl(value), [value]);
  const errorCount = diagnostics.filter((d) => d.severity === "error").length;

  const oplLinter = useMemo(
    () =>
      linter((view): Diagnostic[] =>
        validateOpl(view.state.doc.toString()).map((d) => ({
          from: Math.min(d.from, view.state.doc.length),
          to: Math.min(d.to, view.state.doc.length),
          severity: d.severity,
          message: d.message,
        })),
      ),
    [],
  );

  const theme = useMemo(
    () =>
      EditorView.theme({
        "&": {
          fontSize: "13px",
          backgroundColor: "var(--color-canvas)",
          border: "1px solid var(--color-border)",
          borderRadius: "6px",
        },
        ".cm-content": { fontFamily: "var(--font-mono)" },
        ".cm-gutters": {
          backgroundColor: "var(--color-canvas)",
          color: "var(--color-fg-subtle)",
          border: "none",
        },
        "&.cm-focused": { outline: "none", borderColor: "var(--color-accent)" },
        ".cm-activeLine": { backgroundColor: "rgba(61,83,245,0.04)" },
        ".cm-activeLineGutter": { backgroundColor: "rgba(61,83,245,0.06)" },
      }),
    [],
  );

  return (
    <div>
      <input type="hidden" name="opl" value={value} />
      <CodeMirror
        value={value}
        height="460px"
        extensions={[
          javascript({ typescript: true }),
          oplLinter,
          lintGutter(),
          theme,
          EditorView.lineWrapping,
        ]}
        basicSetup={{ lineNumbers: true, foldGutter: true }}
        onChange={setValue}
      />
      <div className="mt-2 text-sm">
        {errorCount === 0 ? (
          <span className="text-success-emphasis">✓ OPL looks valid</span>
        ) : (
          <span className="text-error">
            {errorCount} {errorCount === 1 ? "error" : "errors"} — fix before
            saving
          </span>
        )}
      </div>
    </div>
  );
}
