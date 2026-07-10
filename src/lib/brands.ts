import { MDC_MARKETING_TEMPLATE_IDS } from "./mdc-marketing-templates";
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
    enabledTemplateIds: MDC_MARKETING_TEMPLATE_IDS,
    overlays: [],
  },
};

export function getBrandConfig(brandId: string | null | undefined): BrandConfig | null {
  if (!brandId) return null;
  return BRAND_CONFIGS[brandId] ?? null;
}
