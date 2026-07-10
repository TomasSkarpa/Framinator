import type { TemplateId } from "./types";

export type BrandOverlayPlacement =
  | "bracket-composition"
  | "floating-caption-bar"
  | "gradient-footer"
  | "logo-shadow"
  | "poster-frame";

export type BrandOverlay = {
  placement: BrandOverlayPlacement;
  templateIds?: readonly TemplateId[];
  logoSrc: string;
  backgroundColor?: string;
  foregroundColor?: string;
  heightPct?: number;
  maxLogoWidthPct?: number;
  maxLogoHeightPct?: number;
  yPct?: number;
  xPct?: number;
  insetPct?: number;
  borderPct?: number;
  lineWidthPct?: number;
  shadowOffsetPct?: number;
};

export type BrandConfig = {
  id: string;
  name: string;
  subtitle: string;
  storageKey: string;
  colors: {
    primary: string;
    foreground: string;
    background?: string;
  };
  assets: {
    logoColor?: string;
    logoLight?: string;
    logoDark?: string;
  };
  enabledTemplateIds: readonly TemplateId[];
  overlays: readonly BrandOverlay[];
};

export const BRAND_CONFIGS: Record<string, BrandConfig> = {
  mdc: {
    id: "mdc",
    name: "Framinator",
    subtitle: "MDC branding",
    storageKey: "brand:mdc",
    colors: {
      primary: "#ee0015",
      foreground: "#ffffff",
    },
    assets: {
      logoColor: "/branding/mdc/logo-red.png",
      logoLight: "/branding/mdc/logo-white.png",
      logoDark: "/branding/mdc/logo-black.png",
    },
    enabledTemplateIds: [
      "framed-polaroid",
      "clean-carousel",
      "soft-focus",
      "kodak-strip",
      "layered-spread-scatter",
    ],
    overlays: [
      {
        placement: "poster-frame",
        templateIds: ["framed-polaroid"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        foregroundColor: "#f4f1ea",
        insetPct: 6,
        borderPct: 4,
        maxLogoWidthPct: 24,
        maxLogoHeightPct: 2.8,
      },
      {
        placement: "bracket-composition",
        templateIds: ["clean-carousel"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        insetPct: 6.5,
        lineWidthPct: 4.2,
        maxLogoWidthPct: 26,
        maxLogoHeightPct: 2.9,
      },
      {
        placement: "floating-caption-bar",
        templateIds: ["soft-focus"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        yPct: 82,
        heightPct: 13,
        maxLogoWidthPct: 38,
        maxLogoHeightPct: 3.6,
      },
      {
        placement: "logo-shadow",
        templateIds: ["kodak-strip"],
        logoSrc: "/branding/mdc/logo-white.png",
        foregroundColor: "#ee0015",
        xPct: 50,
        yPct: 91,
        maxLogoWidthPct: 42,
        maxLogoHeightPct: 4,
        shadowOffsetPct: 1.2,
      },
      {
        placement: "gradient-footer",
        templateIds: ["layered-spread-scatter"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        heightPct: 48,
        maxLogoWidthPct: 42,
        maxLogoHeightPct: 3.8,
      },
    ],
  },
};

export function getBrandConfig(brandId: string | null | undefined): BrandConfig | null {
  if (!brandId) return null;
  return BRAND_CONFIGS[brandId] ?? null;
}
