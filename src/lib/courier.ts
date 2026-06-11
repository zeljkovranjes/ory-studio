/** Courier message statuses Kratos reports, usable as a list filter. */
export const COURIER_STATUSES = [
  "queued",
  "sent",
  "processing",
  "abandoned",
] as const;

export type CourierStatus = (typeof COURIER_STATUSES)[number];

/**
 * Validate a status filter value from the query string. Returns the status if
 * it is one Kratos understands, otherwise undefined ("all" / anything else) so
 * an arbitrary value can never be forwarded to the admin API.
 */
export function courierStatusFilter(
  value: string | undefined,
): CourierStatus | undefined {
  return value && (COURIER_STATUSES as readonly string[]).includes(value)
    ? (value as CourierStatus)
    : undefined;
}
