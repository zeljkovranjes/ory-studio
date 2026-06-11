import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, SelectField, TextField } from "@/components/forms";
import { saveSmsConfig } from "./actions";

export const dynamic = "force-dynamic";

interface CourierChannel {
  id: string;
  request_config?: { url?: string; method?: string };
}

export default async function SmsConfigurationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const config = await readKratosRaw();

  if ("error" in config) {
    return (
      <Card>
        <ErrorState message={`Could not read Kratos config: ${config.error}`} />
      </Card>
    );
  }

  const channels = getPath<CourierChannel[]>(config, ["courier", "channels"], []);
  const sms = channels.find((channel) => channel.id === "sms");

  return (
    <>
      <PageHeader
        title="SMS configuration"
        description="Configure the HTTP endpoint Kratos calls to deliver SMS messages (one-time codes, recovery codes). Any provider with an HTTP API works — Twilio, Vonage, or your own gateway."
      />
      <Flash {...flash} />

      <Card
        title="SMS delivery endpoint"
        description="Unsecured endpoints expose your delivery channel to abuse — protect the endpoint with authentication and TLS."
      >
        <form action={saveSmsConfig}>
          <TextField
            name="url"
            label="URL"
            description="The HTTP endpoint that delivers the SMS"
            defaultValue={sms?.request_config?.url ?? ""}
            mono
            wide
          />
          <SelectField
            name="method"
            label="Request method"
            description="The HTTP method to use when sending the request"
            defaultValue={sms?.request_config?.method ?? "POST"}
            options={[
              { value: "GET", label: "GET" },
              { value: "POST", label: "POST" },
              { value: "PUT", label: "PUT" },
              { value: "PATCH", label: "PATCH" },
            ]}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
