import { afterEach, describe, expect, it, vi } from "vitest";

// The tenant module reads next/headers cookies; stub it so we can unit-test
// single-mode resolution without a request context.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("@/lib/tenants", () => ({
  getTenantBySlug: async () => null,
  listTenants: async () => [],
}));

import {
  currentTenant,
  currentTenantConfig,
  tenancyMode,
  DEFAULT_TENANT_ID,
} from "@/lib/tenant";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("tenancyMode", () => {
  it("defaults to single and flips to multi via env", () => {
    delete process.env.TENANCY_MODE;
    expect(tenancyMode()).toBe("single");
    process.env.TENANCY_MODE = "multi";
    expect(tenancyMode()).toBe("multi");
  });
});

describe("currentTenant (single mode)", () => {
  it("returns the implicit env-configured tenant", async () => {
    delete process.env.TENANCY_MODE;
    process.env.ORY_KRATOS_ADMIN_URL = "http://kratos:4434";
    process.env.ORY_KRATOS_PUBLIC_URL = "http://localhost:4433";
    process.env.ORY_HYDRA_ADMIN_URL = "http://hydra:4445";
    const tenant = await currentTenant();
    expect(tenant.id).toBe(DEFAULT_TENANT_ID);
    expect(tenant.services.kratosAdminUrl).toBe("http://kratos:4434");
    expect(tenant.services.hydraAdminUrl).toBe("http://hydra:4445");
  });

  it("falls back to the env instance in multi mode with no tenants", async () => {
    process.env.TENANCY_MODE = "multi";
    process.env.ORY_KRATOS_ADMIN_URL = "http://kratos:4434";
    process.env.ORY_KRATOS_PUBLIC_URL = "http://localhost:4433";
    const tenant = await currentTenant();
    expect(tenant.id).toBe(DEFAULT_TENANT_ID);
  });
});

describe("currentTenantConfig", () => {
  it("resolves config paths and container names from env in single mode", async () => {
    delete process.env.TENANCY_MODE;
    process.env.KRATOS_CONFIG_PATH = "/etc/kratos.yml";
    const cfg = await currentTenantConfig();
    expect(cfg.kratosConfigPath).toBe("/etc/kratos.yml");
    expect(cfg.kratosContainer).toBe("kratos");
    expect(cfg.hydraContainer).toBe("hydra");
    expect(cfg.ketoContainer).toBe("keto");
  });
});
