import { describe, expect, it } from "vitest";
import { blobPath } from "@/components/ui/voice-bar";

const subpaths = (d: string) => d.match(/M/g)?.length ?? 0;

describe("blobPath", () => {
  it("is one circle when the controls are merged", () => {
    expect(subpaths(blobPath(0))).toBe(1);
    expect(blobPath(0)).toBe(blobPath(0.2));
  });

  it("is one waisted outline while the circles pull apart", () => {
    const d = blobPath(25);
    expect(subpaths(d)).toBe(1);
    expect(d).toContain("C");
  });

  it("snaps into two circles once far enough apart", () => {
    expect(subpaths(blobPath(43))).toBe(2);
    expect(subpaths(blobPath(46))).toBe(2);
  });

  it("never emits NaN", () => {
    for (let d = 0; d <= 50; d += 0.5) expect(blobPath(d)).not.toContain("NaN");
  });
});
