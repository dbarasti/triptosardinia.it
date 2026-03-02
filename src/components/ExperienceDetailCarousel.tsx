'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-utils';

const isVideoUrl = (url: string) => /\.(mp4|webm)(\?|$)/i.test(url);

type Props = { imageUrls: string[] };

export function ExperienceDetailCarousel({ imageUrls }: Props) {
  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 py-4 no-scrollbar">
      {imageUrls.map((url, i) => {
        const resolvedUrl = getImageUrl(url);
        const isVideo = isVideoUrl(url);
        const posterUrl =
          i > 0 && !isVideoUrl(imageUrls[i - 1]) ? getImageUrl(imageUrls[i - 1]) : undefined;
        return (
          <div key={i} className="flex-none w-[85%] snap-center">
            {isVideo ? (
              <CarouselVideo
                src={resolvedUrl}
                poster={posterUrl}
                preload={i === 0 ? 'auto' : 'metadata'}
              />
            ) : (
              <Image
                src={resolvedUrl}
                alt=""
                width={600}
                height={450}
                className="w-full aspect-[4/3] object-cover rounded-xl shadow-sm"
                sizes="85vw"
                priority={i === 0}
                loading={i === 0 ? undefined : 'lazy'}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CarouselVideo({
  src,
  poster,
  preload,
}: {
  src: string;
  poster?: string;
  preload: 'auto' | 'metadata';
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.5, rootMargin: '0px' }
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        playsInline
        muted
        loop
        preload={preload}
        poster={poster}
        aria-label="Experience video"
      />
    </div>
  );
}
