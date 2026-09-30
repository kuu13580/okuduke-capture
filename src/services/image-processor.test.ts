import { describe, expect, it } from "vitest";
import { calculateTargetDimensions, calculateVideoCoverCrop } from "./image-processor.ts";

describe("calculateTargetDimensions", () => {
  it("keeps dimensions when within maxDimension", () => {
    const result = calculateTargetDimensions(800, 600, 1280);
    expect(result).toEqual({ width: 800, height: 600 });
  });

  it("scales down maintaining aspect ratio for landscape image", () => {
    // 1920x1080 -> 長辺1280
    const result = calculateTargetDimensions(1920, 1080, 1280);
    expect(result.width).toBe(1280);
    expect(result.height).toBe(720);
  });

  it("scales down maintaining aspect ratio for portrait image", () => {
    // 3000x4000 (高解像度スマホ写真) -> 長辺1280
    const result = calculateTargetDimensions(3000, 4000, 1280);
    expect(result.height).toBe(1280);
    expect(result.width).toBe(960);
  });

  it("handles square image", () => {
    const result = calculateTargetDimensions(2000, 2000, 1280);
    expect(result).toEqual({ width: 1280, height: 1280 });
  });
});

describe("calculateVideoCoverCrop", () => {
  it("calculates accurate video internal coordinates with safety margin", () => {
    // 例: スマホ画面 400x800 に 1080x1920 のビデオを表示 (object-fit: cover)
    // scale = Math.max(400/1080, 800/1920) = 800/1920 = 0.41666...
    // 枠が画面中央 300x400 (left: 50, top: 200) にある場合
    const videoDims = {
      videoWidth: 1080,
      videoHeight: 1920,
      clientWidth: 400,
      clientHeight: 800,
    };
    const frameRect = {
      left: 50,
      top: 200,
      width: 300,
      height: 400,
    };
    const videoRect = {
      left: 0,
      top: 0,
      width: 400,
      height: 800,
    };

    const crop = calculateVideoCoverCrop(videoDims, frameRect, videoRect, 0.08);

    // 枠内の幅は 300 / scale ≒ 720、安全マージンが加味され有効な座標が返る
    expect(crop.sw).toBeGreaterThan(700);
    expect(crop.sh).toBeGreaterThan(900);
    expect(crop.sx).toBeGreaterThanOrEqual(0);
    expect(crop.sy).toBeGreaterThanOrEqual(0);
    expect(crop.sx + crop.sw).toBeLessThanOrEqual(1080);
    expect(crop.sy + crop.sh).toBeLessThanOrEqual(1920);
  });
});
