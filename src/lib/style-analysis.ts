import sharp from "sharp";
import type { AlbumTheme } from "./album-model";

export type StyleAnalysis = {
  theme: AlbumTheme;
  label: string;
  dominantColors: string[];
  brightness: number;
  saturation: number;
  tags: string[];
  summary: string;
};

type Rgb = {
  r: number;
  g: number;
  b: number;
};

type Hsl = {
  hue: number;
  saturation: number;
  lightness: number;
};

const sampleSize = 32;

export async function analyzeImageStyle(buffer: Buffer): Promise<StyleAnalysis> {
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({
      width: sampleSize,
      height: sampleSize,
      fit: "inside",
      withoutEnlargement: true
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const average = getAverageRgb(data, info.channels);
  const hsl = rgbToHsl(average);
  const brightness = roundMetric(getLuminance(average));
  const saturation = roundMetric(hsl.saturation);
  const tags = createStyleTags({ brightness, saturation, hue: hsl.hue });
  const template = mapStyleToTemplate({ brightness, saturation, hue: hsl.hue });
  const dominantColors = [
    rgbToHex(average),
    rgbToHex(mixRgb(average, { r: 244, g: 239, b: 231 }, 0.38)),
    rgbToHex(mixRgb(average, { r: 17, g: 16, b: 14 }, 0.46))
  ];

  return {
    ...template,
    dominantColors,
    brightness,
    saturation,
    tags,
    summary: createStyleSummary(template.label, tags)
  };
}

export function mapStyleToTemplate({
  brightness,
  saturation,
  hue
}: {
  brightness: number;
  saturation: number;
  hue: number;
}): Pick<StyleAnalysis, "theme" | "label"> {
  if (brightness < 0.34) {
    return { theme: "lowlight-night", label: "低调夜景" };
  }

  if (brightness > 0.68 && saturation > 0.45) {
    return { theme: "bright-portrait", label: "明亮人像" };
  }

  if (brightness > 0.62 && hue >= 165 && hue <= 235) {
    return { theme: "clear-travel", label: "清透旅行" };
  }

  if (hue >= 70 && hue <= 165 && saturation >= 0.28) {
    return { theme: "natural-landscape", label: "自然风景" };
  }

  return { theme: "film-daily", label: "胶片日常" };
}

function getAverageRgb(data: Buffer, channels: number): Rgb {
  let red = 0;
  let green = 0;
  let blue = 0;
  const pixelCount = data.length / channels;

  for (let index = 0; index < data.length; index += channels) {
    red += data[index] ?? 0;
    green += data[index + 1] ?? 0;
    blue += data[index + 2] ?? 0;
  }

  return {
    r: Math.round(red / pixelCount),
    g: Math.round(green / pixelCount),
    b: Math.round(blue / pixelCount)
  };
}

function getLuminance({ r, g, b }: Rgb) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return { hue: hue * 60, saturation, lightness };
}

function createStyleTags({
  brightness,
  saturation,
  hue
}: {
  brightness: number;
  saturation: number;
  hue: number;
}) {
  const tags: string[] = [];

  if (brightness >= 0.68) {
    tags.push("明亮");
  } else if (brightness <= 0.34) {
    tags.push("低调");
  } else {
    tags.push("中等亮度");
  }

  if (saturation >= 0.48) {
    tags.push("高饱和");
  } else if (saturation <= 0.24) {
    tags.push("低饱和");
  } else {
    tags.push("柔和色彩");
  }

  if (hue >= 165 && hue <= 250) {
    tags.push("冷色");
  } else if (hue >= 45 && hue <= 165) {
    tags.push("自然色");
  } else {
    tags.push("暖色");
  }

  return tags;
}

function createStyleSummary(label: string, tags: string[]) {
  return `${tags.join("、")}，适合${label}风格。`;
}

function mixRgb(base: Rgb, target: Rgb, amount: number): Rgb {
  return {
    r: Math.round(base.r + (target.r - base.r) * amount),
    g: Math.round(base.g + (target.g - base.g) * amount),
    b: Math.round(base.b + (target.b - base.b) * amount)
  };
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}
