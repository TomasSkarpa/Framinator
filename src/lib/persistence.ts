import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AspectRatio } from "./constants";
import type { FilterPreset, PhotoCrop, TemplateId } from "./types";

type StoredPhoto = {
  id: string;
  name: string;
  blob: Blob;
  crop: PhotoCrop;
};

type StoredSlide = {
  id: string;
  cells: { photoId: string; gridColumn?: number; variant?: "cover" | "full" | "inset" }[];
};

export type StoredProject = {
  id: "current";
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
    key: "current";
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

export async function saveProject(project: StoredProject): Promise<void> {
  const db = await getDb();
  await db.put("project", { ...project, updatedAt: Date.now() }, "current");
}

export async function loadProject(): Promise<StoredProject | null> {
  const db = await getDb();
  return (await db.get("project", "current")) ?? null;
}

export async function clearProject(): Promise<void> {
  const db = await getDb();
  await db.delete("project", "current");
}
