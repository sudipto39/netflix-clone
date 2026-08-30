/**
 * videoCatalog.ts
 * Unified, persistent Video Catalog and CRUD Repository for Streamly.
 * Synchronizes with localStorage (streamly_video_catalog) and provides real-time event dispatching.
 */
import type { MediaItem } from "@/types/media";
import { apiRequest } from "./api";

export interface VideoCatalogItem extends MediaItem {
  videoUrl?: string;
  durationMinutes?: number;
  featuredOrder?: number;
  tags?: string[];
  quality?: "4K UHD" | "1080p Full HD" | "720p HD";
  year?: number;
  addedAt?: string;
  viewsCount?: number;
}

const CATALOG_STORAGE_KEY = "streamly_video_catalog";
const CATALOG_VERSION_KEY = "streamly_catalog_version";
const CATALOG_VERSION = "5"; // bump this whenever default URLs change

/** Clear stale catalog if version is outdated so users always get fresh URLs */
function ensureCatalogVersion(): void {
  if (localStorage.getItem(CATALOG_VERSION_KEY) !== CATALOG_VERSION) {
    localStorage.removeItem(CATALOG_STORAGE_KEY);
    localStorage.setItem(CATALOG_VERSION_KEY, CATALOG_VERSION);
  }
}

export const DEFAULT_CATALOG: VideoCatalogItem[] = [
  {
    id: 1,
    title: "Dune: Part Two",
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    vote_average: 8.2,
    release_date: "2024-02-27",
    year: 2024,
    media_type: "movie",
    genre_ids: [878, 12],
    quality: "4K UHD",
    durationMinutes: 166,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    viewsCount: 28450,
    addedAt: "2024-03-01T10:00:00Z",
  },
  {
    id: 2,
    title: "Oppenheimer",
    overview: "The story of an enigmatic physicist forced to grapple with the moral consequences of changing the world forever.",
    backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    vote_average: 8.1,
    release_date: "2023-07-19",
    year: 2023,
    media_type: "movie",
    genre_ids: [18, 36],
    quality: "4K UHD",
    durationMinutes: 180,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    viewsCount: 24190,
    addedAt: "2024-02-15T12:00:00Z",
  },
  {
    id: 3,
    title: "The Dark Knight",
    overview: "Batman faces a criminal mastermind whose reign of chaos pushes Gotham and its heroes to their limits.",
    backdrop_path: "/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    vote_average: 8.5,
    release_date: "2008-07-16",
    year: 2008,
    media_type: "movie",
    genre_ids: [28, 80],
    quality: "4K UHD",
    durationMinutes: 152,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    viewsCount: 31200,
    addedAt: "2024-01-10T08:00:00Z",
  },
  {
    id: 4,
    title: "Stranger Things",
    name: "Stranger Things",
    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.",
    backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    vote_average: 8.6,
    first_air_date: "2016-07-15",
    year: 2016,
    media_type: "tv",
    genre_ids: [18, 9648],
    quality: "4K UHD",
    durationMinutes: 55,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    viewsCount: 38940,
    addedAt: "2024-01-05T09:30:00Z",
  },
  {
    id: 5,
    title: "Wednesday",
    name: "Wednesday",
    overview: "Smart, sarcastic and a little dead inside, Wednesday Addams investigates twisted mysteries at Nevermore Academy.",
    backdrop_path: "/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",
    poster_path: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
    vote_average: 8.4,
    first_air_date: "2022-11-23",
    year: 2022,
    media_type: "tv",
    genre_ids: [35, 9648],
    quality: "4K UHD",
    durationMinutes: 48,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    viewsCount: 29800,
    addedAt: "2024-02-01T14:15:00Z",
  },
  {
    id: 6,
    title: "Blade Runner 2049",
    overview: "A young blade runner unearths a long-buried secret that leads him to track down a former LAPD officer.",
    backdrop_path: "/ilRyazdMJwN05exqhwK4tMKBYZs.jpg",
    poster_path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    vote_average: 7.6,
    release_date: "2017-10-04",
    year: 2017,
    media_type: "movie",
    genre_ids: [878, 18],
    quality: "4K UHD",
    durationMinutes: 164,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    viewsCount: 17400,
    addedAt: "2024-01-20T11:00:00Z",
  },
  {
    id: 7,
    title: "The Last of Us",
    name: "The Last of Us",
    overview: "A hardened survivor escorts a teenager across a post-apocalyptic America in search of hope.",
    backdrop_path: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg",
    poster_path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
    vote_average: 8.6,
    first_air_date: "2023-01-15",
    year: 2023,
    media_type: "tv",
    genre_ids: [18, 10759],
    quality: "4K UHD",
    durationMinutes: 60,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    viewsCount: 26500,
    addedAt: "2024-02-10T16:00:00Z",
  },
  {
    id: 8,
    title: "Interstellar",
    overview: "Explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    vote_average: 8.4,
    release_date: "2014-11-05",
    year: 2014,
    media_type: "movie",
    genre_ids: [12, 18, 878],
    quality: "4K UHD",
    durationMinutes: 169,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    viewsCount: 35100,
    addedAt: "2024-01-15T18:00:00Z",
  },
  {
    id: 9,
    title: "Arcane",
    name: "Arcane",
    overview: "Amid the stark discord of twin cities, two sisters fight on rival sides of a war between magic and technology.",
    backdrop_path: "/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg",
    poster_path: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    vote_average: 8.7,
    first_air_date: "2021-11-06",
    year: 2021,
    media_type: "tv",
    genre_ids: [16, 10759],
    quality: "4K UHD",
    durationMinutes: 42,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    viewsCount: 22800,
    addedAt: "2024-02-18T10:00:00Z",
  },
  {
    id: 10,
    title: "Mad Max: Fury Road",
    overview: "In a ruined wasteland, Max joins a rebel warrior fleeing a tyrant and his army in a roaring war rig.",
    backdrop_path: "/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg",
    poster_path: "/hA2ple9q4qnwxp3hKVNhroipsir.jpg",
    vote_average: 7.6,
    release_date: "2015-05-13",
    year: 2015,
    media_type: "movie",
    genre_ids: [28, 12],
    quality: "4K UHD",
    durationMinutes: 120,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
    viewsCount: 19400,
    addedAt: "2024-01-25T13:00:00Z",
  },
  {
    id: 11,
    title: "The Bear",
    name: "The Bear",
    overview: "A young chef returns home to run his family's sandwich shop and transform its chaotic kitchen.",
    backdrop_path: "/ySRAQdbALRr5G5YVgR3SsjcJtLw.jpg",
    poster_path: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",
    vote_average: 8.2,
    first_air_date: "2022-06-23",
    year: 2022,
    media_type: "tv",
    genre_ids: [18, 35],
    quality: "1080p Full HD",
    durationMinutes: 35,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    viewsCount: 21300,
    addedAt: "2024-02-05T15:00:00Z",
  },
  {
    id: 12,
    title: "Planet Earth III",
    name: "Planet Earth III",
    overview: "Extraordinary stories from the natural world reveal the beauty and fragility of life on Earth.",
    backdrop_path: "/7k3wAa6W0N0W5LYj7ZQhZQNWwH8.jpg",
    poster_path: "/2yfz0ZSgZQXWW8YpYhY4emTuW4q.jpg",
    vote_average: 9.0,
    first_air_date: "2023-10-22",
    year: 2023,
    media_type: "tv",
    genre_ids: [99],
    quality: "4K UHD",
    durationMinutes: 50,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
    viewsCount: 16800,
    addedAt: "2024-01-30T17:00:00Z",
  },
];

export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
};

/**
 * Returns all videos stored in localStorage or seeds with default catalog
 */
export function getCatalogVideos(): VideoCatalogItem[] {
  try {
    ensureCatalogVersion();
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(DEFAULT_CATALOG));
      return DEFAULT_CATALOG;
    }
    const parsed = JSON.parse(raw) as VideoCatalogItem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATALOG;
  } catch {
    return DEFAULT_CATALOG;
  }
}

function saveCatalog(items: VideoCatalogItem[]): void {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("streamly:catalog-change", { detail: items }));
}

/**
 * Fetch video catalog asynchronously from backend API
 */
export async function fetchServerCatalog(): Promise<VideoCatalogItem[]> {
  try {
    const res = await apiRequest<{ data: Record<string, unknown>[] }>("/admin/catalog");
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      const formatted: VideoCatalogItem[] = res.data.map((item) => ({
        id: (item.tmdbId || item.id) as number,
        title: (item.title as string) || "Untitled",
        overview: (item.overview as string) || "",
        backdrop_path: (item.backdropPath || item.backdrop_path) as string | null,
        poster_path: (item.posterPath || item.poster_path) as string | null,
        vote_average: (item.voteAverage || item.vote_average || 7.5) as number,
        release_date: item.releaseDate as string | undefined,
        first_air_date: item.firstAirDate as string | undefined,
        media_type: (item.mediaType || "movie") as "movie" | "tv",
        genre_ids: (item.genreIds as number[]) || [28, 12],
        quality: (item.quality as VideoCatalogItem["quality"]) || "4K UHD",
        durationMinutes: (item.durationMinutes as number) || 120,
        videoUrl: (item.videoUrl as string) || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        viewsCount: (item.viewsCount as number) || 15000,
        addedAt: (item.createdAt as string) || new Date().toISOString(),
      }));

      saveCatalog(formatted);
      return formatted;
    }
  } catch {
    // Fall back to local storage
  }
  return getCatalogVideos();
}

/**
 * Get video by ID
 */
export function getVideoById(id: number): VideoCatalogItem | undefined {
  const list = getCatalogVideos();
  return list.find((item) => item.id === id);
}

/**
 * Create a new video
 */
export function createVideo(data: Omit<VideoCatalogItem, "id" | "addedAt">): VideoCatalogItem {
  const list = getCatalogVideos();
  const maxId = list.reduce((max, item) => (item.id > max ? item.id : max), 0);
  const newId = maxId + 1;

  const newItem: VideoCatalogItem = {
    ...data,
    id: newId,
    name: data.media_type === "tv" ? data.title : undefined,
    vote_average: Number(data.vote_average) || 7.5,
    viewsCount: data.viewsCount ?? 0,
    addedAt: new Date().toISOString(),
    videoUrl: data.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    backdrop_path: data.backdrop_path || "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    poster_path: data.poster_path || "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  };

  const updated = [newItem, ...list];
  saveCatalog(updated);
  return newItem;
}

/**
 * Update an existing video
 */
export function updateVideo(id: number, data: Partial<VideoCatalogItem>): VideoCatalogItem | null {
  const list = getCatalogVideos();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = list[index];
  const updatedItem: VideoCatalogItem = {
    ...current,
    ...data,
    id, // preserve ID
    name: (data.media_type || current.media_type) === "tv" ? (data.title || current.title) : undefined,
  };

  list[index] = updatedItem;
  saveCatalog(list);
  return updatedItem;
}

/**
 * Delete a video by ID
 */
export function deleteVideo(id: number): boolean {
  const list = getCatalogVideos();
  const filtered = list.filter((item) => item.id !== id);
  if (filtered.length === list.length) return false;

  saveCatalog(filtered);
  return true;
}

/**
 * Reset video catalog to factory defaults
 */
export function resetCatalogToDefaults(): VideoCatalogItem[] {
  saveCatalog(DEFAULT_CATALOG);
  return DEFAULT_CATALOG;
}
