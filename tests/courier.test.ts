import { describe, expect, it } from "vitest";
import { courierStatusFilter, COURIER_STATUSES } from "@/lib/courier";

describe("courierStatusFilter", () => {
  it("accepts each valid Kratos status", () => {
    for (const s of COURIER_STATUSES) {
      expect(courierStatusFilter(s)).toBe(s);
    }
  });

  it("returns undefined for missing, 'all', or unknown values", () => {
    expect(courierStatusFilter(undefined)).toBeUndefined();
    expect(courierStatusFilter("")).toBeUndefined();
    expect(courierStatusFilter("all")).toBeUndefined();
    expect(courierStatusFilter("SENT")).toBeUndefined();
  });

  it("never forwards an injection-y value to the API", () => {
    expect(courierStatusFilter("sent' OR 1=1")).toBeUndefined();
    expect(courierStatusFilter("../../admin")).toBeUndefined();
  });
});
