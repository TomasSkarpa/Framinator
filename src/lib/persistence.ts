import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AspectRatio } from "./constants";
import type {
  FilterPreset,
  LayeredPrintsLayout,
  PhotoCrop,
  TemplateId,
} from "./types";

type StoredPhoto = {
  id: string;
  name: string;
  blob: Blob;
  crop: PhotoCrop;
};

type StoredSlide = {
  id: string;
  cells: { photoId: string }[];
  layeredPrints?: LayeredPrintsLayout;
  overlayEnabled?: boolean;
};

export type StoredProject = {
  id: string;
  templateId: TemplateId | null;
  slides: StoredSlide[];
  filter: FilterPreset;
  borderWidth: number;
  aspectRatio: AspectRatio;
  photos: StoredPhoto[];
  updatedAt: number;
};

interface FraminatorDB extends DBSchema {
  project: {
    key: string;
    value: StoredProject;
  };
}

let dbPromise: Promise<IDBPDatabase<FraminatorDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FraminatorDB>("framinator", 1, {
      upgrade(db) {
        db.createObjectStore("project");
      },
    });
  }
  return dbPromise;
}

export async function saveProject(project: StoredProject, key = "current"): Promise<void> {
  const db = await getDb();
  await db.put("project", { ...project, id: key, updatedAt: Date.now() }, key);
}

export async function loadProject(key = "current"): Promise<StoredProject | null> {
  const db = await getDb();
  return (await db.get("project", key)) ?? null;
}

export async function clearProject(key = "current"): Promise<void> {
  const db = await getDb();
  await db.delete("project", key);
}
