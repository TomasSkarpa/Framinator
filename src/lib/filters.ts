import type { FilterPreset } from "./types";

export type FilterDef = {
  id: FilterPreset;
  label: string;
  cube: string;
  description: string;
};

/** Film LUT filters from photo_logic curated set. */
export const FILTERS: FilterDef[] = [
  { id: "none", label: "None", cube: "", description: "Original" },
  {
    id: "portra-400",
    label: "Portra 400",
    cube: "kodak_portra_400.cube",
    description: "Warm portrait negative",
  },
  {
    id: "pro-400h",
    label: "Pro 400H",
    cube: "fuji_400h.cube",
    description: "Soft Fuji portrait",
  },
  {
    id: "astia",
    label: "Astia",
    cube: "fuji_astia_100_generic.cube",
    description: "Soft, flattering skin",
  },
  {
    id: "classic-chrome",
    label: "Classic Chrome",
    cube: "fuji_xtrans_iii_classic_chrome.cube",
    description: "Muted documentary",
  },
  {
    id: "velvia",
    label: "Velvia",
    cube: "fuji_velvia_100_generic.cube",
    description: "Punchy, travel",
  },
  {
    id: "velvia-50",
    label: "Velvia 50",
    cube: "fuji_velvia_50.cube",
    description: "Deep saturation",
  },
  {
    id: "provia",
    label: "Provia",
    cube: "fuji_provia_100_generic.cube",
    description: "Neutral slide",
  },
  {
    id: "kodachrome",
    label: "Kodachrome",
    cube: "kodak_kodachrome_64_generic.cube",
    description: "Rich reds, classic",
  },
  {
    id: "elite-chrome",
    label: "Elite Chrome",
    cube: "kodak_elite_chrome_200.cube",
    description: "Classic slide",
  },
  {
    id: "xpro",
    label: "Xpro",
    cube: "kodak_elite_100_xpro.cube",
    description: "Cross-process",
  },
  {
    id: "agfa-precisa",
    label: "Precisa",
    cube: "agfa_precisa_100.cube",
    description: "Agfa slide warmth",
  },
  {
    id: "superia",
    label: "Superia −",
    cube: "fuji_superia_800_-.cube",
    description: "Moody, underexposed",
  },
  {
    id: "fp100c",
    label: "FP-100c",
    cube: "fuji_fp_100c.cube",
    description: "Instant film",
  },
  {
    id: "polaroid-669",
    label: "Polaroid 669",
    cube: "polaroid_669.cube",
    description: "Peel-apart instant",
  },
  {
    id: "acros",
    label: "Acros",
    cube: "fuji_xtrans_iii_acros.cube",
    description: "Fine-grain B&W",
  },
  {
    id: "kodak-2383",
    label: "2383",
    cube: "kodak_2383_constlmap.cube",
    description: "Hollywood print",
  },
  {
    id: "fuji-3513",
    label: "3513",
    cube: "fuji_3513_constlmap.cube",
    description: "Fuji print film",
  },
];

export function cubeUrl(filter: FilterPreset): string | null {
  const def = FILTERS.find((f) => f.id === filter);
  if (!def?.cube) return null;
  return `/luts/${def.cube}`;
}

/** Map legacy CSS filter ids from saved projects. */
export function normalizeFilter(value: string): FilterPreset {
  const ids = new Set(FILTERS.map((f) => f.id));
  if (ids.has(value as FilterPreset)) return value as FilterPreset;
  return "none";
}
