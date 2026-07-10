import type { TemplateId } from "./types";

export type BrandOverlayPlacement =
  | "bottom-band"
  | "bottom-mark"
  | "polaroid-frame";

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
  ruleWidthPct?: number;
  ruleHeightPct?: number;
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
    enabledTemplateIds: ["framed-polaroid", "kodak-strip", "soft-focus"],
    overlays: [
      {
        placement: "polaroid-frame",
        templateIds: ["framed-polaroid"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        heightPct: 7.5,
        maxLogoWidthPct: 28,
        maxLogoHeightPct: 3.2,
      },
      {
        placement: "bottom-band",
        templateIds: ["soft-focus"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        heightPct: 7.5,
        maxLogoWidthPct: 28,
        maxLogoHeightPct: 3.2,
      },
      {
        placement: "bottom-mark",
        templateIds: ["kodak-strip"],
        logoSrc: "/branding/mdc/logo-red.png",
        foregroundColor: "#ee0015",
        yPct: 94,
        maxLogoWidthPct: 26,
        maxLogoHeightPct: 3,
        ruleWidthPct: 30,
        ruleHeightPct: 0.5,
      },
    ],
  },
};

export function getBrandConfig(brandId: string | null | undefined): BrandConfig | null {
  if (!brandId) return null;
  return BRAND_CONFIGS[brandId] ?? null;
}
