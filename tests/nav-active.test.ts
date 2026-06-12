import { describe, expect, it } from "vitest";
import { activeSidebarHref, SECTIONS } from "@/lib/nav";

const activity = SECTIONS.find((s) => s.href === "/activity")!.sidebar;
const oauth = SECTIONS.find((s) => s.href === "/oauth")!.sidebar;

describe("activeSidebarHref", () => {
  it("highlights only Logs & events on /activity/events (not Live)", () => {
    expect(activeSidebarHref(activity, "/activity/events")).toBe(
      "/activity/events",
    );
  });

  it("highlights Live only on /activity itself", () => {
    expect(activeSidebarHref(activity, "/activity")).toBe("/activity");
  });

  it("does not keep the first item active on deeper sibling pages", () => {
    // /oauth is the first sidebar item; on /oauth/configure only General matches.
    expect(activeSidebarHref(oauth, "/oauth/configure")).toBe("/oauth/configure");
    expect(activeSidebarHref(oauth, "/oauth")).toBe("/oauth");
  });

  it("matches the parent item on a deep detail route", () => {
    const um = SECTIONS.find((s) => s.href === "/identities")!.sidebar;
    expect(activeSidebarHref(um, "/identities/abc-123")).toBe("/identities");
  });

  it("returns undefined when nothing matches", () => {
    expect(activeSidebarHref(activity, "/nowhere")).toBeUndefined();
  });

  it("always resolves to a single item across every section/sub-route", () => {
    for (const section of SECTIONS) {
      for (const item of section.sidebar) {
        const href = activeSidebarHref(section.sidebar, item.href);
        // The item's own route must resolve to itself, never a different sibling.
        expect(href).toBe(item.href);
      }
    }
  });
});
