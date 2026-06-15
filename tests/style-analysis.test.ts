import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  analyzeImageStyle,
  mapStyleToTemplate
} from "../src/lib/style-analysis";

test("analyzeImageStyle extracts color metrics and maps a bright image", async () => {
  const buffer = await createSolidImage("#e8b056");
  const style = await analyzeImageStyle(buffer);

  assert.equal(style.theme, "bright-portrait");
  assert.equal(style.label, "明亮人像");
  assert.equal(style.dominantColors[0], "#e8b056");
  assert.ok(style.brightness > 0.65);
  assert.ok(style.saturation > 0.55);
  assert.ok(style.tags.includes("明亮"));
  assert.ok(style.tags.includes("高饱和"));
});

test("mapStyleToTemplate returns stable templates from thresholds", () => {
  assert.deepEqual(
    mapStyleToTemplate({ brightness: 0.2, saturation: 0.3, hue: 220 }),
    { theme: "lowlight-night", label: "低调夜景" }
  );
  assert.deepEqual(
    mapStyleToTemplate({ brightness: 0.68, saturation: 0.35, hue: 190 }),
    { theme: "clear-travel", label: "清透旅行" }
  );
  assert.deepEqual(
    mapStyleToTemplate({ brightness: 0.52, saturation: 0.4, hue: 120 }),
    { theme: "natural-landscape", label: "自然风景" }
  );
});

async function createSolidImage(color: string) {
  return sharp({
    create: {
      width: 40,
      height: 40,
      channels: 3,
      background: color
    }
  })
    .png()
    .toBuffer();
}
