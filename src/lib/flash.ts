import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SaveResult } from "./config-engine";

/** Redirect back to a config page with a saved/warning/error banner param. */
export function flashRedirect(path: string, result: SaveResult): never {
  revalidatePath(path);
  const params = new URLSearchParams();
  if (result.error) params.set("error", result.error);
  else if (result.warning) params.set("warning", result.warning);
  else params.set("saved", "1");
  redirect(`${path}?${params}`);
}
