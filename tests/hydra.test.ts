import { describe, expect, it } from "vitest";
import { parseRedirectUris, splitScopes } from "@/lib/hydra";

describe("splitScopes", () => {
  it("splits a space-delimited scope string into a list", () => {
    expect(splitScopes("openid offline_access email")).toEqual([
      "openid",
      "offline_access",
      "email",
    ]);
  });

  it("collapses extra whitespace and trims", () => {
    expect(splitScopes("  openid   email  ")).toEqual(["openid", "email"]);
    expect(splitScopes("openid\tprofile\nemail")).toEqual([
      "openid",
      "profile",
      "email",
    ]);
  });

  it("returns an empty list for empty or undefined scope", () => {
    expect(splitScopes("")).toEqual([]);
    expect(splitScopes(undefined)).toEqual([]);
    expect(splitScopes("   ")).toEqual([]);
  });
});

describe("parseRedirectUris", () => {
  it("accepts https, http and custom mobile schemes", () => {
    const { uris, invalid } = parseRedirectUris(
      "https://app.example.com/cb\nhttp://localhost:3000/cb\nmyapp://callback",
    );
    expect(uris).toEqual([
      "https://app.example.com/cb",
      "http://localhost:3000/cb",
      "myapp://callback",
    ]);
    expect(invalid).toEqual([]);
  });

  it("trims, ignores blank lines, and handles CRLF", () => {
    const { uris } = parseRedirectUris(
      "  https://a.test/cb  \r\n\r\nhttps://b.test/cb\n",
    );
    expect(uris).toEqual(["https://a.test/cb", "https://b.test/cb"]);
  });

  it("rejects URIs without a scheme://host shape", () => {
    const { uris, invalid } = parseRedirectUris("/relative\nnot a uri\nhttps://ok.test/cb");
    expect(uris).toEqual(["https://ok.test/cb"]);
    expect(invalid).toEqual(["/relative", "not a uri"]);
  });

  it("rejects dangerous schemes (javascript/data/vbscript/file)", () => {
    const { uris, invalid } = parseRedirectUris(
      [
        "javascript://%0aalert(1)",
        "JavaScript://x",
        "data://text/html,x",
        "vbscript://x",
        "file:///etc/passwd",
      ].join("\n"),
    );
    expect(uris).toEqual([]);
    expect(invalid).toHaveLength(5);
  });
});
