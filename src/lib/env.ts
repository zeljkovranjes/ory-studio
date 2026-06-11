/** Central, typed access to studio configuration. Read env only through here. */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get kratosAdminUrl(): string {
    return required("ORY_KRATOS_ADMIN_URL");
  },
  get kratosPublicUrl(): string {
    return required("ORY_KRATOS_PUBLIC_URL");
  },
  get hydraAdminUrl(): string | undefined {
    return process.env.ORY_HYDRA_ADMIN_URL;
  },
  get ketoReadUrl(): string | undefined {
    return process.env.ORY_KETO_READ_URL;
  },
  get ketoWriteUrl(): string | undefined {
    return process.env.ORY_KETO_WRITE_URL;
  },
  get kratosConfigPath(): string | undefined {
    return process.env.KRATOS_CONFIG_PATH;
  },
  get tenancyMode(): "single" | "multi" {
    return process.env.TENANCY_MODE === "multi" ? "multi" : "single";
  },
};
