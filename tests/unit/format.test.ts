import { describe, expect, it } from "vitest";

import {
  formatAgeYears,
  formatCalendarDate,
  formatCalendarYear,
  formatChartDate,
  formatDateTime,
  formatDisplayWeight,
  formatLength,
  formatMeasurementListDate,
  formatNumber,
  formatPetAge,
  formatWeight,
  formatWeightChange,
} from "@/lib/i18n/format";

describe("localized formatting", () => {
  it("formats derived ages as a localized unit", () => {
    expect(formatAgeYears(4.78)).toBe("4.8 years");
  });

  it("formats a calendar date without shifting the day", () => {
    expect(formatCalendarDate("2026-06-20")).toContain("20");
  });

  it("formats compact chart dates", () => {
    expect(formatChartDate("2026-05-30")).toMatch(/May.+26/);
  });

  it("formats compact measurement list dates and year groups", () => {
    expect(formatMeasurementListDate("2026-05-30")).toMatch(/May.+30|30.+May/);
    expect(formatCalendarYear("2026-05-30")).toBe("2026");
  });

  it("rejects an impossible calendar date", () => {
    expect(() => formatCalendarDate("2026-02-30")).toThrow(RangeError);
  });

  it("formats exact moments in a chosen time zone", () => {
    const value = formatDateTime("2026-06-20T12:30:00.000Z", {
      timeZone: "UTC",
    });

    expect(value).toContain("2026");
  });

  it("formats numbers and converts display units", () => {
    expect(formatNumber(1234.5)).toMatch(/1.+234/);
    expect(formatWeight(1500, "kg")).toContain("1.5");
    expect(formatLength(125, "cm")).toContain("12.5");
  });

  it("adapts displayed weights and weight changes without changing stored grams", () => {
    expect(formatDisplayWeight(750)).toContain("750");
    expect(formatDisplayWeight(2_250)).toContain("2.25");
    expect(formatWeightChange(-1_250)).toContain("−1.25");
  });

  it("formats natural pet ages", () => {
    expect(formatPetAge(0.6, { approximate: true })).toBe("~7 months");
    expect(formatPetAge(2.25)).toBe("2 years 3 months");
  });
});
