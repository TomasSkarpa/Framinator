"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MAX_PHOTOS } from "@/lib/constants";
import { clearProject, loadProject, saveProject } from "@/lib/persistence";
import { normalizeFilter } from "@/lib/filters";
import { slidesFromPhotos, usedPhotoIds } from "@/lib/templates";
import { preparePhoto } from "@/lib/prepare-photo";
import type {
  FilterPreset,
  PhotoItem,
  ProjectState,
  Slide,
  TemplateId,
} from "@/lib/types";
import { uid } from "@/lib/utils";

type Action =
  | { type: "ADD_PHOTOS"; files: File[] }
  | { type: "REMOVE_PHOTO"; photoId: string }
  | { type: "SET_TEMPLATE"; templateId: TemplateId }
  | { type: "REORDER_SLIDES"; from: number; to: number }
  | { type: "ASSIGN_PHOTO"; slideId: string; photoId: string }
  | { type: "SET_FILTER"; filter: FilterPreset }
  | { type: "SET_BORDER"; borderWidth: number }
  | { type: "SET_ASPECT"; aspectRatio: ProjectState["aspectRatio"] }
  | { type: "UPDATE_CROP"; photoId: string; crop: PhotoItem["crop"] }
  | { type: "RESTORE"; state: ProjectState }
  | { type: "RESET" };

const initialState: ProjectState = {
  photos: [],
  templateId: null,
  slides: [],
  filter: "none",
  borderWidth: 8,
  aspectRatio: "4:5",
};

function defaultCrop(): PhotoItem["crop"] {
  return { offsetX: 0, offsetY: 0, scale: 1 };
}

function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case "ADD_PHOTOS": {
      const existingNames = new Set(state.photos.map((p) => p.name));
      const room = MAX_PHOTOS - state.photos.length;
      const incoming = action.files.filter((f) => !existingNames.has(f.name));
      const accepted = incoming.slice(0, room);
      const added: PhotoItem[] = accepted.map((f) => ({
        id: uid(),
        name: f.name,
        objectUrl: URL.createObjectURL(f),
        crop: defaultCrop(),
        _file: f,
      }));
      const photos = [...state.photos, ...added];
      const slides = state.templateId
        ? slidesFromPhotos(state.templateId, photos)
        : state.slides;
      return { ...state, photos, slides };
    }
    case "REMOVE_PHOTO": {
      const photo = state.photos.find((p) => p.id === action.photoId);
      if (photo) URL.revokeObjectURL(photo.objectUrl);
      const photos = state.photos.filter((p) => p.id !== action.photoId);
      const slides =
        photos.length === 0
          ? []
          : state.templateId
            ? slidesFromPhotos(state.templateId, photos)
            : state.slides;
      return {
        ...state,
        photos,
        slides,
        templateId: photos.length === 0 ? null : state.templateId,
      };
    }
    case "SET_TEMPLATE": {
      return {
        ...state,
        templateId: action.templateId,
        slides: slidesFromPhotos(action.templateId, state.photos),
      };
    }
    case "REORDER_SLIDES": {
      const slides = [...state.slides];
      const [moved] = slides.splice(action.from, 1);
      slides.splice(action.to, 0, moved);
      return { ...state, slides };
    }
    case "ASSIGN_PHOTO": {
      const slides = state.slides.map((s) =>
        s.id === action.slideId
          ? { ...s, cells: [{ ...s.cells[0], photoId: action.photoId }] }
          : s,
      );
      return { ...state, slides };
    }
    case "SET_FILTER":
      return { ...state, filter: action.filter };
    case "SET_BORDER":
      return { ...state, borderWidth: action.borderWidth };
    case "SET_ASPECT":
      return { ...state, aspectRatio: action.aspectRatio };
    case "UPDATE_CROP":
      return {
        ...state,
        photos: state.photos.map((p) =>
          p.id === action.photoId ? { ...p, crop: action.crop } : p,
        ),
      };
    case "RESTORE":
      return action.state;
    case "RESET":
      state.photos.forEach((p) => URL.revokeObjectURL(p.objectUrl));
      return initialState;
    default:
      return state;
  }
}

type ProjectContextValue = {
  state: ProjectState;
  selectedSlideId: string | null;
  selectedSlideIndex: number;
  selectedSlide: Slide | null;
  selectSlide: (slideId: string) => void;
  addPhotos: (files: File[]) => Promise<{ added: number; rejected: number; limitHit: boolean }>;
  removePhoto: (id: string) => void;
  setTemplate: (id: TemplateId) => void;
  reorderSlides: (from: number, to: number) => void;
  assignPhoto: (slideId: string, photoId: string) => void;
  setFilter: (f: FilterPreset) => void;
  setBorder: (n: number) => void;
  setAspect: (a: ProjectState["aspectRatio"]) => void;
  updateCrop: (photoId: string, crop: PhotoItem["crop"]) => void;
  reset: () => void;
  unusedPhotos: PhotoItem[];
  fileByPhotoId: Map<string, File>;
  resumeAvailable: boolean;
  acceptResume: () => Promise<void>;
  dismissResume: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const pendingRestore = useRef<ProjectState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileByPhotoId = useMemo(() => {
    const m = new Map<string, File>();
    for (const p of state.photos) {
      if (p._file) m.set(p.id, p._file);
    }
    return m;
  }, [state.photos]);

  const unusedPhotos = useMemo(() => {
    const used = usedPhotoIds(state.slides);
    return state.photos.filter((p) => !used.has(p.id));
  }, [state.photos, state.slides]);

  const selectedSlideIndex = useMemo(() => {
    if (!selectedSlideId) return 0;
    const i = state.slides.findIndex((s) => s.id === selectedSlideId);
    return i >= 0 ? i : 0;
  }, [state.slides, selectedSlideId]);

  const selectedSlide = state.slides[selectedSlideIndex] ?? null;

  useEffect(() => {
    if (state.slides.length === 0) {
      setSelectedSlideId(null);
      return;
    }
    if (!selectedSlideId || !state.slides.some((s) => s.id === selectedSlideId)) {
      setSelectedSlideId(state.slides[0].id);
    }
  }, [state.slides, selectedSlideId]);

  const selectSlide = useCallback((slideId: string) => {
    setSelectedSlideId(slideId);
  }, []);

  useEffect(() => {
    void (async () => {
      const stored = await loadProject();
      if (!stored || stored.photos.length === 0) return;
      const photos: PhotoItem[] = stored.photos.map((sp) => ({
        id: sp.id,
        name: sp.name,
        objectUrl: URL.createObjectURL(sp.blob),
        crop: sp.crop,
        _file: new File([sp.blob], sp.name, { type: sp.blob.type }),
      }));
      pendingRestore.current = {
        photos,
        templateId: stored.templateId,
        slides: stored.slides as Slide[],
        filter: normalizeFilter(stored.filter),
        borderWidth: stored.borderWidth,
        aspectRatio: stored.aspectRatio,
      };
      setResumeAvailable(true);
    })();
  }, []);

  useEffect(() => {
    if (state.photos.length === 0 && !state.templateId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void (async () => {
        const blobs = await Promise.all(
          state.photos.map(async (p) => {
            const file = p._file ?? fileByPhotoId.get(p.id);
            const blob = file ? file : await fetch(p.objectUrl).then((r) => r.blob());
            return {
              id: p.id,
              name: p.name,
              blob,
              crop: p.crop,
            };
          }),
        );
        await saveProject({
          id: "current",
          templateId: state.templateId,
          slides: state.slides,
          filter: state.filter,
          borderWidth: state.borderWidth,
          aspectRatio: state.aspectRatio,
          photos: blobs,
          updatedAt: Date.now(),
        });
      })();
    }, 5000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, fileByPhotoId]);

  const addPhotos = useCallback(async (files: File[]) => {
    const existingNames = new Set(state.photos.map((p) => p.name));
    const unique = files.filter((f) => !existingNames.has(f.name));
    const room = MAX_PHOTOS - state.photos.length;
    const limitHit = unique.length > room;
    const accepted = unique.slice(0, room);
    const prepared = await Promise.all(accepted.map((f) => preparePhoto(f)));
    dispatch({ type: "ADD_PHOTOS", files: prepared });
    return {
      added: prepared.length,
      rejected: files.length - unique.length,
      limitHit,
    };
  }, [state.photos]);

  const acceptResume = useCallback(async () => {
    if (pendingRestore.current) {
      dispatch({ type: "RESTORE", state: pendingRestore.current });
      pendingRestore.current = null;
    }
    setResumeAvailable(false);
  }, []);

  const dismissResume = useCallback(async () => {
    await clearProject();
    pendingRestore.current = null;
    setResumeAvailable(false);
  }, []);

  const value: ProjectContextValue = {
    state,
    selectedSlideId,
    selectedSlideIndex,
    selectedSlide,
    selectSlide,
    addPhotos,
    removePhoto: (id) => dispatch({ type: "REMOVE_PHOTO", photoId: id }),
    setTemplate: (id) => dispatch({ type: "SET_TEMPLATE", templateId: id }),
    reorderSlides: (from, to) => dispatch({ type: "REORDER_SLIDES", from, to }),
    assignPhoto: (slideId, photoId) =>
      dispatch({ type: "ASSIGN_PHOTO", slideId, photoId }),
    setFilter: (f) => dispatch({ type: "SET_FILTER", filter: f }),
    setBorder: (n) => dispatch({ type: "SET_BORDER", borderWidth: n }),
    setAspect: (a) => dispatch({ type: "SET_ASPECT", aspectRatio: a }),
    updateCrop: (photoId, crop) =>
      dispatch({ type: "UPDATE_CROP", photoId, crop }),
    reset: () => {
      void clearProject();
      setSelectedSlideId(null);
      dispatch({ type: "RESET" });
    },
    unusedPhotos,
    fileByPhotoId,
    resumeAvailable,
    acceptResume,
    dismissResume,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject outside provider");
  return ctx;
}
