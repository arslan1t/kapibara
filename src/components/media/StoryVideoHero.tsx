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

/** True when the browser says this connection should not be spent on decoration. */
function connectionIsExpensive(): boolean {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return (
    connection.effectiveType === "slow-2g" ||
    connection.effectiveType === "2g" ||
    connection.effectiveType === "3g"
  );
}

/**
 * Autoplaying, muted, looping story footage in a fixed 16:9 frame.
 *
 * The aspect ratio is owned by the wrapper, so nothing shifts as the video
 * loads.
 *
 * The footage is large, so the element is only mounted when downloading it is
 * actually justified. Three groups never fetch a byte, and all of them get the
 * `fallback` still instead — which is why that prop has to work as a hero image
 * on its own:
 *
 *   • `prefers-reduced-motion` — motion is unwanted.
 *   • Data-saver, or a connection the browser reports as 2G/3G. Most customers
 *     arrive on a phone, and spending tens of megabytes of someone's mobile
 *     data on decoration is not a reasonable default.
 *   • Anything still outside the viewport. On /how-it-works this block sits
 *     well below the fold, so without this it downloaded in full for visitors
 *     who never scrolled to it.
 */
export default function StoryVideoHero({
  src,
  label,
  fallback,
  className,
  controls = true,
}: StoryVideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const [expensive, setExpensive] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setExpensive(connectionIsExpensive());
  }, []);

  // Mount the video only once the frame is near the viewport. `rootMargin`
  // starts the fetch just before it scrolls into view, so the still is not
  // visibly replaced mid-scroll.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const shouldLoadVideo = reducedMotion === false && expensive === false && inView;

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
      ref={frameRef}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-4xl bg-cream-200",
        className
      )}
    >
      <div className="absolute inset-0">{fallback}</div>

      {shouldLoadVideo && (
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

      {controls && shouldLoadVideo && ready && (
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
