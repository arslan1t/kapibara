"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryVideoHeroProps {
  src: string;
  /** Describes the footage for assistive tech — the video carries no audio. */
  label: string;
  /**
   * Rendered underneath the video. Visible while the first frame decodes and
   * kept as the permanent still for `prefers-reduced-motion` users, so it must
   * stand on its own as a hero image.
   */
  fallback: ReactNode;
  className?: string;
  controls?: boolean;
}

/**
 * Autoplaying, muted, looping story footage in a fixed 16:9 frame.
 *
 * The aspect ratio is owned by the wrapper, so nothing shifts as the video
 * loads. Users who prefer reduced motion never download the video at all —
 * the element simply isn't mounted for them.
 */
export default function StoryVideoHero({
  src,
  label,
  fallback,
  className,
  controls = true,
}: StoryVideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  // The autoplay attribute alone is unreliable (tabs restored in the
  // background, some mobile browsers). Nudge playback once the video is ready;
  // if the browser still refuses, the poster stays and the control works.
  function handleCanPlay() {
    setReady(true);
    const video = videoRef.current;
    if (!video || !video.paused) return;
    video.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-4xl bg-cream-200",
        className
      )}
    >
      <div className="absolute inset-0">{fallback}</div>

      {reducedMotion === false && (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0"
          )}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
          onCanPlay={handleCanPlay}
        />
      )}

      {controls && reducedMotion === false && ready && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Поставить видео на паузу" : "Продолжить видео"}
          className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-brown-dark/45 text-white backdrop-blur-sm transition-all duration-300 hover:bg-brown-dark/70"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
        </button>
      )}
    </div>
  );
}
