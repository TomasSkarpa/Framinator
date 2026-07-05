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
    id: "astia",
    label: "Astia",
    cube: "fuji_astia_100_generic.cube",
    description: "Soft, flattering skin",
  },
  {
    id: "velvia",
    label: "Velvia",
    cube: "fuji_velvia_100_generic.cube",
    description: "Punchy, travel",
  },
  {
    id: "fp100c",
    label: "FP-100c",
    cube: "fuji_fp_100c.cube",
    description: "Instant film",
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
    id: "superia",
    label: "Superia −",
    cube: "fuji_superia_800_-.cube",
    description: "Moody, underexposed",
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
