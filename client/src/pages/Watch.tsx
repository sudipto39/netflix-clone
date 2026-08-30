import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Captions,
  Gauge,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  ScanLine,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { mediaTitle } from "@/lib/utils";
import type { MediaItem } from "@/types/media";
import { getVideoById, getCatalogVideos } from "@/lib/videoCatalog";
import { recordVideoView } from "@/lib/analytics";
import { useSession } from "@/lib/mockAuth";
import { useApp } from "@/components/AppProvider";

// High-performance mock video pool (including bundled local sample fallback)
const VIDEO_POOL: string[] = [
  "/videos/sample.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
];

function getSourcesForId(id: number): string[] {
  const safeId = Math.abs(id || 1);
  const primary = VIDEO_POOL[safeId % VIDEO_POOL.length];
  const fallback = VIDEO_POOL[(safeId + 1) % VIDEO_POOL.length];
  const localFallback = "/videos/sample.mp4";
  const list = [primary, fallback, localFallback];
  return Array.from(new Set(list));
}

const ALL_MEDIA_CATALOG: Record<number, MediaItem> = {
  1: { id: 1, title: "Dune: Part Two", overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.", backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", vote_average: 8.2, release_date: "2024-02-27", genre_ids: [878, 12] },
  2: { id: 2, title: "Oppenheimer", overview: "The story of an enigmatic physicist forced to grapple with the moral consequences of changing the world forever.", backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", vote_average: 8.1, release_date: "2023-07-19", genre_ids: [18, 36] },
  3: { id: 3, title: "The Dark Knight", overview: "Batman faces a criminal mastermind whose reign of chaos pushes Gotham and its heroes to their limits.", backdrop_path: "/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", vote_average: 8.5, release_date: "2008-07-16", genre_ids: [28, 80] },
  4: { id: 4, title: "Stranger Things", overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.", backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", vote_average: 8.6, first_air_date: "2016-07-15", genre_ids: [18, 9648], media_type: "tv" },
  5: { id: 5, title: "Wednesday", overview: "Smart, sarcastic and a little dead inside, Wednesday Addams investigates twisted mysteries at Nevermore Academy.", backdrop_path: "/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg", poster_path: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", vote_average: 8.4, first_air_date: "2022-11-23", genre_ids: [35, 9648], media_type: "tv" },
  6: { id: 6, title: "Blade Runner 2049", overview: "A young blade runner unearths a long-buried secret that leads him to track down a former LAPD officer.", backdrop_path: "/ilRyazdMJwN05exqhwK4tMKBYZs.jpg", poster_path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", vote_average: 7.6, release_date: "2017-10-04", genre_ids: [878, 18] },
  7: { id: 7, title: "The Last of Us", overview: "A hardened survivor escorts a teenager across a post-apocalyptic America in search of hope.", backdrop_path: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg", poster_path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg", vote_average: 8.6, first_air_date: "2023-01-15", genre_ids: [18, 10759], media_type: "tv" },
  8: { id: 8, title: "Interstellar", overview: "Explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg", poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", vote_average: 8.4, release_date: "2014-11-05", genre_ids: [12, 18, 878] },
  9: { id: 9, title: "Arcane", overview: "Amid the stark discord of twin cities, two sisters fight on rival sides of a war between magic and technology.", backdrop_path: "/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg", poster_path: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg", vote_average: 8.7, first_air_date: "2021-11-06", genre_ids: [16, 10759], media_type: "tv" },
  10: { id: 10, title: "Mad Max: Fury Road", overview: "In a ruined wasteland, Max joins a rebel warrior fleeing a tyrant and his army in a roaring war rig.", backdrop_path: "/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg", poster_path: "/hA2ple9q4qnwxp3hKVNhroipsir.jpg", vote_average: 7.6, release_date: "2015-05-13", genre_ids: [28, 12] },
  11: { id: 11, title: "The Bear", overview: "A young chef returns home to run his family's sandwich shop and transform its chaotic kitchen.", backdrop_path: "/ySRAQdbALRr5G5YVgR3SsjcJtLw.jpg", poster_path: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg", vote_average: 8.2, first_air_date: "2022-06-23", genre_ids: [18, 35], media_type: "tv" },
  12: { id: 12, title: "Planet Earth III", overview: "Extraordinary stories from the natural world reveal the beauty and fragility of life on Earth.", backdrop_path: "/7k3wAa6W0N0W5LYj7ZQhZQNWwH8.jpg", poster_path: "/2yfz0ZSgZQXWW8YpYhY4emTuW4q.jpg", vote_average: 9.0, first_air_date: "2023-10-22", genre_ids: [99], media_type: "tv" },
};

const FALLBACK_MEDIA: MediaItem = ALL_MEDIA_CATALOG[1];

export default function WatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mediaId = Number(searchParams.get("id") ?? "1");
  const urlTitle = searchParams.get("title");
  const { data: session } = useSession();
  const { profile, addToWatchHistory } = useApp();

  const [currentMedia, setCurrentMedia] = useState<MediaItem>(() => {
    const passedMedia = (location.state as { media?: MediaItem } | null)?.media;
    if (passedMedia) return passedMedia;
    const catVideo = getVideoById(mediaId);
    if (catVideo) return catVideo;
    if (ALL_MEDIA_CATALOG[mediaId]) return ALL_MEDIA_CATALOG[mediaId];
    if (urlTitle) {
      return {
        ...FALLBACK_MEDIA,
        id: mediaId,
        title: urlTitle,
      };
    }
    return FALLBACK_MEDIA;
  });

  useEffect(() => {
    const passedMedia = (location.state as { media?: MediaItem } | null)?.media;
    if (passedMedia) {
      setCurrentMedia(passedMedia);
      return;
    }
    const catVideo = getVideoById(mediaId);
    if (catVideo) {
      setCurrentMedia(catVideo);
      return;
    }
    if (ALL_MEDIA_CATALOG[mediaId]) {
      setCurrentMedia(ALL_MEDIA_CATALOG[mediaId]);
      return;
    }
    if (urlTitle) {
      setCurrentMedia((prev) => ({
        ...prev,
        id: mediaId,
        title: urlTitle,
      }));
      return;
    }

    const fetchTmdbMedia = async () => {
      const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN as string | undefined;
      const key = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
      if (!token && !key) return;

      try {
        const type = searchParams.get("type") || "movie";
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${mediaId}${key ? `?api_key=${key}` : ""}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentMedia(data);
        }
      } catch {}
    };

    fetchTmdbMedia();
  }, [mediaId, urlTitle, location.state, searchParams]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTrackedViewRef = useRef<boolean>(false);

  const customCatalogItem = getVideoById(mediaId);
  const sources = useMemo(() => {
    const list: string[] = [];
    if (customCatalogItem?.videoUrl) list.push(customCatalogItem.videoUrl);
    const fallbacks = getSourcesForId(mediaId);
    for (const f of fallbacks) {
      if (!list.includes(f)) list.push(f);
    }
    return list.length > 0 ? list : fallbacks;
  }, [mediaId, customCatalogItem]);

  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    hasTrackedViewRef.current = false;
    setSourceIndex(0);
    setHasError(false);
    setIsBuffering(true);
  }, [mediaId]);

  const trackViewOnce = (watchTime: number, totalDur: number) => {
    if (hasTrackedViewRef.current) return;
    if (watchTime >= 4 || watchTime >= totalDur * 0.1) {
      hasTrackedViewRef.current = true;
      recordVideoView(
        mediaId,
        mediaTitle(currentMedia) || "Stream Title",
        Math.max(15, Math.round(watchTime)),
        Math.round(totalDur || 120 * 60),
        {
          id: session?.user?.id,
          email: session?.user?.email,
          name: profile?.name || session?.user?.name,
        }
      );
    }
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState<number>(1);
  const [objectFit, setObjectFit] = useState<"cover" | "contain">("cover");
  const [showCaptions, setShowCaptions] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showUpNext, setShowUpNext] = useState(false);
  const [upNextCountdown, setUpNextCountdown] = useState(10);
  const upNextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const allCatalog = useMemo(() => getCatalogVideos(), []);
  const isTV = currentMedia?.media_type === "tv" || !!currentMedia?.first_air_date;

  const upNextMedia = useMemo(() => {
    const list = allCatalog.filter((item) => item.id !== mediaId);
    const similar = list.filter((item) => item.genre_ids?.some((g) => currentMedia?.genre_ids?.includes(g)));
    return similar[0] ?? list[0];
  }, [allCatalog, mediaId, currentMedia]);

  const tvSeasons = useMemo(
    () => [
      { season: 1, episodes: 8 },
      { season: 2, episodes: 8 },
      { season: 3, episodes: 6 },
    ],
    []
  );
  const currentSeasonEpisodes = tvSeasons.find((s) => s.season === selectedSeason)?.episodes ?? 8;

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      const targetVol = volume === 0 ? 1 : volume;
      setVolume(targetVol);
      videoRef.current.volume = targetVol;
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const renderVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="size-7 sm:size-8 stroke-[2]" />;
    }
    if (volume < 0.5) {
      return <Volume1 className="size-7 sm:size-8 stroke-[2]" />;
    }
    return <Volume2 className="size-7 sm:size-8 stroke-[2]" />;
  };

  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const speedMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const currentSource = sources[sourceIndex] ?? sources[0];

  const handleSpeedMouseEnter = () => {
    if (speedMenuTimeoutRef.current) clearTimeout(speedMenuTimeoutRef.current);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowSpeedMenu(true);
    setShowControls(true);
  };

  const handleSpeedMouseLeave = () => {
    if (speedMenuTimeoutRef.current) clearTimeout(speedMenuTimeoutRef.current);
    speedMenuTimeoutRef.current = setTimeout(() => {
      setShowSpeedMenu(false);
    }, 500);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    if (speedMenuTimeoutRef.current) clearTimeout(speedMenuTimeoutRef.current);
    setShowSpeedMenu(false);
  };

  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (offsetX / rect.width) * 100;
    const time = (percentage / 100) * duration;
    setHoverPos(percentage);
    setHoverTime(time);
  };

  const handleSeekMouseLeave = () => {
    setHoverTime(null);
  };

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (!showSpeedMenu) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4500);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (speedMenuTimeoutRef.current) clearTimeout(speedMenuTimeoutRef.current);
    };
  }, [showSpeedMenu]);

  const safePlay = async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.play();
      setIsPlaying(true);
      setHasError(false);
      setIsBuffering(false);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          try {
            await videoRef.current.play();
            setIsPlaying(true);
            setHasError(false);
            setIsBuffering(false);
          } catch {
            setIsPlaying(false);
          }
        }
      } else {
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      safePlay();
    }
  };

  const saveProgressDebounced = useCallback(() => {
    if (progressSaveTimerRef.current) clearTimeout(progressSaveTimerRef.current);
    progressSaveTimerRef.current = setTimeout(() => {
      if (!videoRef.current || !currentMedia) return;
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      const pct = Math.round((cur / dur) * 100);
      if (pct > 2 && pct < 98) {
        addToWatchHistory({
          id: currentMedia.id,
          title: mediaTitle(currentMedia),
          progress: pct,
          backdrop_path: currentMedia.backdrop_path,
          poster_path: currentMedia.poster_path,
          media_type: currentMedia.media_type,
          watchedAt: Date.now(),
        });
      }
    }, 5000);
  }, [currentMedia, addToWatchHistory]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress((cur / dur) * 100);
    trackViewOnce(cur, dur);
    saveProgressDebounced();
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setIsBuffering(false);
    }
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
    safePlay();
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handleVideoError = () => {
    setIsBuffering(false);
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((prev) => prev + 1);
    } else {
      // Fallback directly to local sample MP4 without ever showing error
      setHasError(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (Number(e.target.value) / 100) * duration;
    videoRef.current.currentTime = seekTime;
    setProgress(Number(e.target.value));
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">
      {/* Top Header / Back Arrow */}
      <div
        className={`absolute inset-x-0 top-0 z-30 flex items-center gap-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="grid size-12 sm:size-14 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/20 active:scale-95 shadow-xl"
          aria-label="Back to browse"
        >
          <ArrowLeft className="size-8 sm:size-9 stroke-[2.2]" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl drop-shadow-md">
            {mediaTitle(currentMedia)}
          </h1>
          <p className="text-xs text-[#aaa]">Now Streaming in Ultra HD 4K</p>
        </div>
      </div>

      {/* Buffering Spinner */}
      {isBuffering && !hasError && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/40">
          <div className="size-12 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent" />
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
          <AlertTriangle className="size-12 text-[#e50914] mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Unable to stream video</h2>
          <p className="max-w-md text-xs text-[#aaa] mb-6">
            The video source encountered a network issue or was blocked by browser privacy settings.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setHasError(false);
                setSourceIndex(0);
                setIsBuffering(true);
                if (videoRef.current) {
                  videoRef.current.load();
                  safePlay();
                }
              }}
              className="rounded bg-[#e50914] px-5 py-2 text-xs font-semibold text-white hover:bg-[#b81d24]"
            >
              Retry Playback
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/20"
            >
              Back to Browse
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Real-Time Ambilight Screen Glow */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden opacity-35">
        <div
          className="absolute inset-0 bg-cover bg-center blur-[100px] scale-110"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/w500${currentMedia?.backdrop_path ?? currentMedia?.poster_path})`,
          }}
        />
      </div>

      {/* Video Element */}
      <video
        key={currentSource}
        ref={videoRef}
        src={currentSource}
        autoPlay
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onError={handleVideoError}
        onEnded={() => {
          setIsPlaying(false);
          setShowUpNext(true);
          setUpNextCountdown(10);
          if (upNextTimerRef.current) clearInterval(upNextTimerRef.current);
          upNextTimerRef.current = setInterval(() => {
            setUpNextCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(upNextTimerRef.current!);
                if (upNextMedia) {
                  navigate(`/watch?id=${upNextMedia.id}&title=${encodeURIComponent(mediaTitle(upNextMedia))}`, {
                    state: { media: upNextMedia },
                  });
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }}
        onClick={togglePlay}
        className={`relative z-10 h-full w-full cursor-pointer ${
          objectFit === "cover" ? "object-cover" : "object-contain"
        }`}
      />



      {/* Up Next Overlay */}
      <AnimatePresence>
        {showUpNext && upNextMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="relative flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-[#1a1a1a]/90 p-8 text-center shadow-2xl max-w-sm mx-4">
              <button
                onClick={() => {
                  setShowUpNext(false);
                  if (upNextTimerRef.current) clearInterval(upNextTimerRef.current!);
                }}
                className="absolute top-3 right-3 rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
              <p className="text-xs font-bold uppercase tracking-widest text-[#e50914]">Up Next</p>
              <img
                src={`https://image.tmdb.org/t/p/w342${upNextMedia.backdrop_path ?? upNextMedia.poster_path}`}
                alt={mediaTitle(upNextMedia)}
                className="w-full rounded-lg object-cover aspect-video"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <h2 className="text-lg font-bold text-white">{mediaTitle(upNextMedia)}</h2>
              <div className="flex items-center gap-3">
                <Link
                  to={`/watch?id=${upNextMedia.id}&title=${encodeURIComponent(mediaTitle(upNextMedia))}`}
                  state={{ media: upNextMedia }}
                  className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white/80"
                >
                  <Play className="size-4 fill-current" /> Play ({upNextCountdown}s)
                </Link>
                <button
                  onClick={() => {
                    setShowUpNext(false);
                    if (upNextTimerRef.current) clearInterval(upNextTimerRef.current!);
                  }}
                  className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Selector Panel (TV shows) */}
      <AnimatePresence>
        {showEpisodes && isTV && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring" as const, damping: 25, stiffness: 220 }}
            className="absolute inset-y-0 right-0 z-40 w-72 flex flex-col bg-black/95 backdrop-blur-xl border-l border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-bold text-sm text-white">Episodes</p>
              <button onClick={() => setShowEpisodes(false)} className="text-white/50 hover:text-white transition text-lg">
                ✕
              </button>
            </div>
            <div className="flex gap-2 px-4 py-3 border-b border-white/10">
              {tvSeasons.map((s) => (
                <button
                  key={s.season}
                  onClick={() => setSelectedSeason(s.season)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    selectedSeason === s.season
                      ? "bg-[#e50914] text-white"
                      : "border border-white/15 text-[#aaa] hover:text-white"
                  }`}
                >
                  S{s.season}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {Array.from({ length: currentSeasonEpisodes }, (_, i) => i + 1).map((ep) => (
                <Link
                  key={ep}
                  to={`/watch?id=${mediaId}&title=${encodeURIComponent(
                    mediaTitle(currentMedia) + " S" + selectedSeason + "E" + ep
                  )}`}
                  state={{ media: currentMedia }}
                  onClick={() => setShowEpisodes(false)}
                  className="group flex items-center gap-3 rounded-lg border border-white/8 bg-white/5 p-3 text-sm transition hover:bg-white/10"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded bg-white/10 font-black text-[#e50914] text-xs group-hover:bg-[#e50914] group-hover:text-white transition">
                    {ep}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-xs">Episode {ep}</p>
                    <p className="text-[10px] text-[#888]">S{selectedSeason} · 45m</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-transparent px-6 pb-6 pt-12 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Custom Animated Netflix Seek Bar */}
        <div
          ref={progressBarRef}
          onMouseMove={handleSeekMouseMove}
          onMouseLeave={handleSeekMouseLeave}
          className="group relative flex items-center mb-5 cursor-pointer py-2 select-none"
        >
          {/* Floating Hover Time Preview Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-10 z-40 -translate-x-1/2 pointer-events-none transition-all duration-75"
              style={{ left: `${hoverPos}%` }}
            >
              <div className="flex flex-col items-center">
                <span className="rounded-md border border-red-500/40 bg-black/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-xl backdrop-blur-md">
                  {formatTime(hoverTime)}
                </span>
                <div className="h-1.5 w-1.5 rotate-45 border-b border-r border-red-500/40 bg-black/90 -mt-1" />
              </div>
            </div>
          )}

          {/* Progress Track Background */}
          <div className="relative h-1.5 group-hover:h-3 w-full overflow-hidden rounded-full bg-white/20 transition-all duration-200 ease-out shadow-inner">
            {/* Hover Ghost Bar */}
            {hoverTime !== null && (
              <div
                className="absolute inset-y-0 left-0 bg-white/25 transition-all"
                style={{ width: `${hoverPos}%` }}
              />
            )}

            {/* Animated Glowing Active Progress Track */}
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-red-700 via-[#e50914] to-red-500 shadow-[0_0_14px_rgba(229,9,20,0.9)] transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            >
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}
            </div>
          </div>

          {/* Interactive Red Knob / Thumb Dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150 scale-0 group-hover:scale-100"
            style={{ left: `${progress}%` }}
          >
            <div className="size-4.5 rounded-full bg-white border-2 border-[#e50914] shadow-[0_0_12px_#e50914] transition-transform group-hover:scale-110 active:scale-125" />
          </div>

          {/* Native Range Input */}
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleSeek}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Main Play / Pause Button */}
            <button
              onClick={togglePlay}
              className="grid size-12 sm:size-14 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/25 active:scale-95 shadow-xl"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="size-8 sm:size-9 fill-current" />
              ) : (
                <Play className="size-8 sm:size-9 fill-current ml-0.5" />
              )}
            </button>

            {/* Rewind 10s Button */}
            <button
              onClick={() => skip(-10)}
              className="relative grid size-11 sm:size-13 place-items-center rounded-full text-white/80 transition-all duration-200 hover:scale-110 hover:text-white hover:bg-white/15 active:scale-95"
              title="Rewind 10 seconds"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="size-7 sm:size-8 stroke-[2]" />
              <span className="absolute text-[11px] sm:text-[12px] font-black tracking-tighter text-white select-none">
                10
              </span>
            </button>

            {/* Forward 10s Button */}
            <button
              onClick={() => skip(10)}
              className="relative grid size-11 sm:size-13 place-items-center rounded-full text-white/80 transition-all duration-200 hover:scale-110 hover:text-white hover:bg-white/15 active:scale-95"
              title="Forward 10 seconds"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="size-7 sm:size-8 stroke-[2]" />
              <span className="absolute text-[11px] sm:text-[12px] font-black tracking-tighter text-white select-none">
                10
              </span>
            </button>

            {/* Sound Controller */}
            <div className="group relative flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="grid size-11 sm:size-13 place-items-center rounded-full text-white/80 transition-all duration-200 hover:scale-110 hover:text-white hover:bg-white/15 active:scale-95"
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {renderVolumeIcon()}
              </button>

              <div className="flex w-0 overflow-hidden items-center gap-2 transition-all duration-300 ease-out group-hover:w-28 sm:group-hover:w-36 opacity-0 group-hover:opacity-100">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="h-1.5 w-20 sm:w-24 accent-[#e50914] bg-white/30 rounded-lg cursor-pointer transition-all hover:h-2"
                />
                <span className="text-[11px] font-black text-white/90 select-none min-w-[28px]">
                  {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>

            {/* Current Time / Duration Display */}
            <span className="text-xs sm:text-sm font-bold tracking-wide text-[#ddd] select-none ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Playback Speed Control */}
            <div className="relative py-3" onMouseEnter={handleSpeedMouseEnter} onMouseLeave={handleSpeedMouseLeave}>
              <div
                className={`absolute bottom-full right-0 mb-4 z-50 flex flex-col items-center gap-3 rounded-2xl border border-white/30 bg-black/95 px-6 py-4 shadow-[0_15px_45px_rgba(0,0,0,0.95)] backdrop-blur-2xl whitespace-nowrap transition-all duration-200 min-w-[340px] ${
                  showSpeedMenu
                    ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
                    : "opacity-0 scale-95 pointer-events-none translate-y-3"
                }`}
              >
                <div className="flex items-center justify-center gap-2 border-b border-white/15 pb-2.5 w-full">
                  <Gauge className="size-4 text-[#e50914]" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#aaa] select-none">
                    PLAYBACK SPEED
                  </span>
                </div>

                <div className="relative flex items-center justify-between gap-6 px-3 py-2 w-full">
                  <div className="absolute top-3.5 left-6 right-6 h-1 bg-white/20 pointer-events-none z-0 rounded-full" />

                  {SPEED_OPTIONS.map((speed) => {
                    const isActive = playbackSpeed === speed;
                    return (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className="group relative z-10 flex flex-col items-center gap-2 transition-all cursor-pointer"
                      >
                        <div
                          className={`size-5 rounded-full transition-all duration-200 flex items-center justify-center ${
                            isActive
                              ? "bg-[#e50914] ring-4 ring-[#e50914]/40 scale-125 shadow-[0_0_15px_#e50914]"
                              : "bg-white/40 group-hover:bg-white group-hover:scale-110"
                          }`}
                        >
                          {isActive && <div className="size-2 rounded-full bg-white animate-pulse" />}
                        </div>

                        <span
                          className={`text-xs sm:text-sm font-black tracking-tight transition-colors ${
                            isActive ? "text-white drop-shadow-md scale-110" : "text-[#aaa] group-hover:text-white"
                          }`}
                        >
                          {speed === 1 ? "1.0x" : `${speed}x`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b border-r border-white/30 bg-black/95" />
              </div>

              <button
                className="relative grid size-11 sm:size-13 place-items-center rounded-full text-white/80 transition-all duration-200 hover:scale-110 hover:text-white hover:bg-white/15 active:scale-95"
                title="Playback Speed"
                aria-label="Playback Speed"
              >
                <Gauge className="size-7 sm:size-8 stroke-[2]" />
                <span className="absolute -bottom-1 rounded bg-[#e50914] px-1 text-[9px] font-black text-white shadow-sm select-none">
                  {playbackSpeed === 1 ? "1x" : `${playbackSpeed}x`}
                </span>
              </button>
            </div>

            {/* CC / Subtitles toggle */}
            <button
              onClick={() => setShowCaptions((p) => !p)}
              title="Toggle Captions"
              aria-label="Toggle Captions"
              className={`grid size-11 sm:size-13 place-items-center rounded-full transition-all duration-200 hover:scale-110 hover:bg-white/15 active:scale-95 ${
                showCaptions ? "text-[#e50914] bg-[#e50914]/15" : "text-white/80 hover:text-white"
              }`}
            >
              <Captions className="size-6 sm:size-7 stroke-[2]" />
            </button>

            {/* Fit / Letterbox toggle */}
            <button
              onClick={() => setObjectFit((p) => (p === "cover" ? "contain" : "cover"))}
              title={objectFit === "cover" ? "Switch to Fit (Letterbox)" : "Switch to Fill"}
              aria-label="Toggle fit mode"
              className={`grid size-11 sm:size-13 place-items-center rounded-full transition-all duration-200 hover:scale-110 hover:bg-white/15 active:scale-95 ${
                objectFit === "contain" ? "text-[#e50914] bg-[#e50914]/15" : "text-white/80 hover:text-white"
              }`}
            >
              <ScanLine className="size-6 sm:size-7 stroke-[2]" />
            </button>

            {/* Episode selector (TV only) */}
            {isTV && (
              <button
                onClick={() => setShowEpisodes((p) => !p)}
                title="Episodes"
                aria-label="Episode selector"
                className={`grid size-11 sm:size-13 place-items-center rounded-full transition-all duration-200 hover:scale-110 hover:bg-white/15 active:scale-95 ${
                  showEpisodes ? "text-[#e50914] bg-[#e50914]/15" : "text-white/80 hover:text-white"
                }`}
              >
                <span className="text-[9px] font-black tracking-tight leading-none">EP</span>
              </button>
            )}

            <span className="rounded border border-white/40 bg-black/50 px-2.5 py-1 text-xs font-bold text-white tracking-wider backdrop-blur-sm">
              HD 1080p
            </span>
            <button
              onClick={toggleFullscreen}
              className="grid size-11 sm:size-13 place-items-center rounded-full text-white/80 transition-all duration-200 hover:scale-110 hover:text-white hover:bg-white/15 active:scale-95"
              aria-label="Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="size-7 sm:size-8 stroke-[2]" />
              ) : (
                <Maximize className="size-7 sm:size-8 stroke-[2]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
