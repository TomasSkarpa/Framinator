import { BASE_TEMPLATE_IDS } from "./templates";
import type { TemplateId } from "./types";

export type BrandOverlayPlacement =
  | "bottom-band"
  | "bottom-mark"
  | "corner-badge"
  | "diagonal-stamp"
  | "edge-ribbon"
  | "ghost-logo"
  | "panorama-seam"
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
  xPct?: number;
  widthPct?: number;
  opacity?: number;
  rotationDeg?: number;
  blendMode?: GlobalCompositeOperation;
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  edge?: "left" | "right" | "top" | "bottom";
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
    enabledTemplateIds: BASE_TEMPLATE_IDS,
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
        placement: "ghost-logo",
        templateIds: ["clean-carousel"],
        logoSrc: "/branding/mdc/logo-red.png",
        xPct: 78,
        yPct: 88,
        widthPct: 36,
        opacity: 0.34,
        blendMode: "multiply",
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
      {
        placement: "corner-badge",
        templateIds: ["layered-prints"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        corner: "top-right",
        widthPct: 24,
        heightPct: 6,
        maxLogoWidthPct: 14,
        maxLogoHeightPct: 2.4,
      },
      {
        placement: "panorama-seam",
        templateIds: ["layered-prints-panorama"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        widthPct: 34,
        heightPct: 5.5,
        opacity: 0.92,
      },
      {
        placement: "diagonal-stamp",
        templateIds: ["layered-spread-scatter"],
        logoSrc: "/branding/mdc/logo-red.png",
        xPct: 22,
        yPct: 86,
        widthPct: 34,
        opacity: 0.6,
        rotationDeg: -12,
        blendMode: "multiply",
      },
      {
        placement: "edge-ribbon",
        templateIds: ["layered-spread-cascade"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        edge: "left",
        widthPct: 6,
        maxLogoWidthPct: 18,
        maxLogoHeightPct: 2.4,
      },
      {
        placement: "corner-badge",
        templateIds: ["layered-spread-corner"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        corner: "bottom-left",
        widthPct: 26,
        heightPct: 7,
        maxLogoWidthPct: 16,
        maxLogoHeightPct: 2.8,
      },
      {
        placement: "diagonal-stamp",
        templateIds: ["layered-spread-tilted"],
        logoSrc: "/branding/mdc/logo-white.png",
        xPct: 76,
        yPct: 14,
        widthPct: 26,
        opacity: 0.7,
        rotationDeg: 8,
        blendMode: "screen",
      },
      {
        placement: "edge-ribbon",
        templateIds: ["layered-spread-split"],
        logoSrc: "/branding/mdc/logo-white.png",
        backgroundColor: "#ee0015",
        edge: "bottom",
        heightPct: 4,
        maxLogoWidthPct: 20,
        maxLogoHeightPct: 2.2,
      },
    ],
  },
};

export function getBrandConfig(brandId: string | null | undefined): BrandConfig | null {
  if (!brandId) return null;
  return BRAND_CONFIGS[brandId] ?? null;
}
