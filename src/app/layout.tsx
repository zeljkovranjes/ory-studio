import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Chrome, type TenancyChrome } from "@/components/shell/Chrome";
import { tenancyMode, TENANT_COOKIE } from "@/lib/tenant";
import { listTenants } from "@/lib/tenants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ory-studio",
  description: "Self-hosted console for the open-source Ory stack",
};

async function resolveTenancyChrome(): Promise<TenancyChrome> {
  if (tenancyMode() !== "multi") {
    return { mode: "single", tenants: [] };
  }
  try {
    const [tenants, store] = await Promise.all([listTenants(), cookies()]);
    return {
      mode: "multi",
      tenants: tenants.map((t) => ({ slug: t.slug, name: t.name })),
      current: store.get(TENANT_COOKIE)?.value ?? tenants[0]?.slug,
    };
  } catch {
    // DB unavailable — render the shell without a switcher rather than crashing.
    return { mode: "multi", tenants: [] };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenancy = await resolveTenancyChrome();
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Chrome tenancy={tenancy}>{children}</Chrome>
      </body>
    </html>
  );
}
