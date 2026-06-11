import { describe, expect, it } from "vitest";
import {
  parseDomains,
  validateOrganizationInput,
} from "@/lib/organizations";
import { validateStreamInput } from "@/lib/event-streams";
import { validateSamlInput } from "@/lib/saml";
import { validateThemeTokens, DEFAULT_THEME } from "@/lib/theme";

describe("parseDomains", () => {
  it("splits, trims, lowercases and drops blanks", () => {
    expect(parseDomains("Acme.com, acme.io\n  ACME.dev ")).toEqual([
      "acme.com",
      "acme.io",
      "acme.dev",
    ]);
    expect(parseDomains("")).toEqual([]);
  });
});

describe("validateOrganizationInput", () => {
  it("accepts a valid org", () => {
    expect(() =>
      validateOrganizationInput({ name: "Acme", domains: ["acme.com"] }),
    ).not.toThrow();
  });
  it("rejects empty name and bad domains", () => {
    expect(() =>
      validateOrganizationInput({ name: " ", domains: [] }),
    ).toThrow(/name is required/);
    expect(() =>
      validateOrganizationInput({ name: "Acme", domains: ["not a domain"] }),
    ).toThrow(/Invalid domain/);
  });
});

describe("validateStreamInput", () => {
  it("accepts https and sns destinations", () => {
    expect(() =>
      validateStreamInput({
        name: "audit",
        type: "https",
        url: "https://x.example.com",
      }),
    ).not.toThrow();
    expect(() =>
      validateStreamInput({
        name: "audit",
        type: "sns",
        url: "arn:aws:sns:us-east-1:123:topic",
      }),
    ).not.toThrow();
  });
  it("rejects bad type and mismatched destination", () => {
    expect(() =>
      validateStreamInput({ name: "x", type: "ftp", url: "ftp://x" }),
    ).toThrow(/Unknown stream type/);
    expect(() =>
      validateStreamInput({ name: "x", type: "https", url: "http://x" }),
    ).toThrow(/https:\/\//);
    expect(() =>
      validateStreamInput({ name: "x", type: "sns", url: "https://x" }),
    ).toThrow(/SNS topic ARN/);
  });
});

describe("validateSamlInput", () => {
  it("accepts a metadata URL or an entity ID", () => {
    expect(() =>
      validateSamlInput({
        name: "Okta",
        idpMetadataUrl: "https://idp/meta",
        idpEntityId: "",
      }),
    ).not.toThrow();
    expect(() =>
      validateSamlInput({
        name: "Okta",
        idpMetadataUrl: "",
        idpEntityId: "urn:entity",
      }),
    ).not.toThrow();
  });
  it("rejects missing identifiers and bad URLs", () => {
    expect(() =>
      validateSamlInput({ name: "Okta", idpMetadataUrl: "", idpEntityId: "" }),
    ).toThrow(/metadata URL or an entity ID/);
    expect(() =>
      validateSamlInput({
        name: "Okta",
        idpMetadataUrl: "ftp://idp",
        idpEntityId: "",
      }),
    ).toThrow(/http\(s\)/);
  });
});

describe("validateThemeTokens", () => {
  it("accepts the default palette", () => {
    expect(() => validateThemeTokens(DEFAULT_THEME)).not.toThrow();
  });
  it("rejects non-hex colors", () => {
    expect(() =>
      validateThemeTokens({ ...DEFAULT_THEME, accent: "blue" }),
    ).toThrow(/Invalid color for accent/);
    expect(() =>
      validateThemeTokens({ ...DEFAULT_THEME, accent: "#fff" }),
    ).toThrow(/#rrggbb/);
  });
});
