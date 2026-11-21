import { describe, expect, it } from "vitest";
import { allocate, arcLine, arcPath, barPath, calendarCells, formatCompact, linePath, niceTicks, scaleLinear, seriesColor, smoothPath } from "@/lib/chart";

describe("niceTicks", () => {
  it("rounds the range out to round steps", () => {
    expect(niceTicks(0, 87)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(3, 9.4)).toEqual([2, 4, 6, 8, 10]);
  });

  it("spans negative values", () => {
    expect(niceTicks(-12, 18)).toEqual([-20, -10, 0, 10, 20]);
  });

  it("avoids floating point noise", () => {
    expect(niceTicks(0, 0.7)).toEqual([0, 0.2, 0.4, 0.6, 0.8]);
  });

  it("handles a flat or empty range", () => {
    expect(niceTicks(0, 0)).toEqual([0, 1]);
    expect(niceTicks(40, 40)).toEqual([0, 10, 20, 30, 40]);
    expect(niceTicks(Infinity, -Infinity)).toEqual([0]);
  });
});

describe("scaleLinear", () => {
  it("maps the domain onto the range, inverted too", () => {
    const y = scaleLinear([0, 100], [200, 0]);
    expect(y(0)).toBe(200);
    expect(y(25)).toBe(150);
    expect(y(100)).toBe(0);
  });

  it("does not divide by zero on a flat domain", () => {
    expect(scaleLinear([5, 5], [0, 10])(5)).toBe(0);
  });
});

describe("formatCompact", () => {
  it("shortens large numbers", () => {
    expect(formatCompact(950)).toBe("950");
    expect(formatCompact(12_400)).toBe("12.4K");
    expect(formatCompact(3_000_000)).toBe("3M");
  });
});

describe("seriesColor", () => {
  it("prefers a given colour, then the palette, then gray", () => {
    expect(seriesColor(0, "red")).toBe("red");
    expect(seriesColor(1)).toContain("--chart-2");
    expect(seriesColor(9)).toBe("var(--muted-foreground)");
  });
});

describe("allocate", () => {
  it("rounds shares so they fill every cell", () => {
    expect(allocate([1, 1, 1], 100)).toEqual([34, 33, 33]);
    expect(allocate([48, 31, 12, 6, 9], 100).reduce((a, b) => a + b)).toBe(100);
  });

  it("ignores negatives and an empty total", () => {
    expect(allocate([-5, 10], 10)).toEqual([0, 10]);
    expect(allocate([0, 0], 10)).toEqual([0, 0]);
  });
});

describe("calendarCells", () => {
  it("starts weeks on monday and places each day in its row", () => {
    // 2026-03-04 is a wednesday
    const { weeks, cells } = calendarCells([
      { date: "2026-03-09", value: 2 },
      { date: "2026-03-04", value: 1 },
    ]);
    expect(weeks).toBe(2);
    expect(cells).toEqual([
      { date: "2026-03-04", value: 1, week: 0, day: 2 },
      { date: "2026-03-09", value: 2, week: 1, day: 0 },
    ]);
  });

  it("labels the first month and each month that begins in range", () => {
    const data = ["2026-01-28", "2026-01-31", "2026-02-01", "2026-02-02"].map((date) => ({ date, value: 0 }));
    expect(calendarCells(data).months).toEqual([
      { week: 0, label: "Jan" },
      { week: 0, label: "Feb" },
    ]);
  });

  it("skips bad dates and handles no data", () => {
    expect(calendarCells([{ date: "nope", value: 1 }])).toEqual({ weeks: 0, cells: [], months: [] });
  });
});

describe("paths", () => {
  it("draws straight segments", () => {
    expect(linePath([[0, 0], [10, 5.556]])).toBe("M0,0L10,5.56");
  });

  it("falls back to straight lines below three points", () => {
    expect(smoothPath([[0, 0], [10, 10]])).toBe("M0,0L10,10");
  });

  it("keeps a flat run flat instead of overshooting", () => {
    const d = smoothPath([[0, 10], [10, 0], [20, 0], [30, 10]]);
    const ys = (d.match(/-?[\d.]+/g) ?? []).map(Number).filter((_, i) => i % 2 === 1);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(10);
  });

  it("rounds only the value end of a bar", () => {
    expect(barPath(0, 100, 20, 40, 4)).toBe("M0,100L0,44Q0,40 4,40L16,40Q20,40 20,44L20,100Z");
    expect(barPath(0, 100, 20, 140, 4)).toBe("M0,100L0,136Q0,140 4,140L16,140Q20,140 20,136L20,100Z");
  });

  it("shrinks the corner on a short bar and skips an empty one", () => {
    expect(barPath(0, 10, 20, 8, 4)).toContain("L0,10Q0,8");
    expect(barPath(0, 10, 20, 10, 4)).toBe("");
  });

  it("closes a donut slice through the inner radius", () => {
    expect(arcPath(50, 50, 40, 30, 0, Math.PI / 2)).toBe("M50,10A40,40 0 0 1 90,50L80,50A30,30 0 0 0 50,20Z");
  });

  it("draws an open arc and skips an empty one", () => {
    expect(arcLine(50, 50, 40, 0, Math.PI / 2)).toBe("M50,10A40,40 0 0 1 90,50");
    expect(arcLine(50, 50, 40, 1, 1)).toBe("");
  });

  it("keeps a full circle drawable", () => {
    expect(arcPath(0, 0, 10, 0, 0, Math.PI * 2)).toMatch(/A10,10 0 1 1/);
  });
});
