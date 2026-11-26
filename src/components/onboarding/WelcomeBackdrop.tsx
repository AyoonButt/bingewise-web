"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

const POSTER_URLS = [
  "https://image.tmdb.org/t/p/w342/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
  "https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  "https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  "https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
  "https://image.tmdb.org/t/p/w342/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "https://image.tmdb.org/t/p/w342/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
  "https://image.tmdb.org/t/p/w342/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
  "https://image.tmdb.org/t/p/w342/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  "https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
];

interface Placement {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationFrom: number;
  rotationTo: number;
  driftXFrom: number;
  driftXTo: number;
  driftYFrom: number;
  driftYTo: number;
  duration: number;
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function shuffled(items: string[], random: () => number): string[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function WelcomeBackdrop() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const placements = useMemo<Placement[]>(() => {
    if (!size.width || !size.height) return [];

    const cardWidth = Math.min(220, Math.max(120, size.width * 0.34));
    const cardHeight = cardWidth * 1.5 + 23;
    const stepX = cardWidth * 0.62;
    const stepY = cardHeight * 0.58;
    const columns = Math.floor(size.width / stepX) + 2;
    const rows = Math.floor(size.height / stepY) + 2;
    const random = seededRandom(0x51de);
    const posters = shuffled(POSTER_URLS, seededRandom(0xc011a6e));

    return Array.from({ length: columns * rows }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = -cardWidth * 0.5 + stepX * column + (random() - 0.5) * cardWidth * 0.2;
      const y = -cardHeight * 0.5 + stepY * row + (random() - 0.5) * cardHeight * 0.16;
      const rotation = (random() - 0.5) * 16;
      const seed = ((x * 13 + y * 7) | 0);
      const phase = (seed & 0xff) / 255;
      const direction = (seed & 0x100) === 0 ? 1 : -1;
      const driftXAmplitude = 7 + phase * 7;
      const driftYAmplitude = 4 + phase * 5;
      const rotationAmplitude = 1.2 + phase * 2.2;
      const duration = 480 + Math.floor(phase * 220);

      return {
        url: posters[index % posters.length],
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        rotationFrom: rotation - rotationAmplitude * direction,
        rotationTo: rotation + rotationAmplitude * direction,
        driftXFrom: -driftXAmplitude * direction,
        driftXTo: driftXAmplitude * direction,
        driftYFrom: -driftYAmplitude * direction,
        driftYTo: driftYAmplitude * direction,
        duration,
      };
    });
  }, [size]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {placements.map((placement, index) => (
        <div
          key={index}
          className="welcome-polaroid"
          style={
            {
              left: `${placement.x}px`,
              top: `${placement.y}px`,
              width: `${placement.width}px`,
              height: `${placement.height}px`,
              "--welcome-rotation-from": `${placement.rotationFrom}deg`,
              "--welcome-rotation-to": `${placement.rotationTo}deg`,
              "--welcome-x-from": `${placement.driftXFrom}px`,
              "--welcome-x-to": `${placement.driftXTo}px`,
              "--welcome-y-from": `${placement.driftYFrom}px`,
              "--welcome-y-to": `${placement.driftYTo}px`,
              "--welcome-duration": `${placement.duration}ms`,
            } as CSSProperties
          }
        >
          <div className="h-full w-full rounded-[3px] bg-white p-[5px] pb-[18px] shadow-[0_10px_24px_rgba(15,23,42,0.28)]">
            <div className="relative h-full w-full overflow-hidden rounded-[1px] bg-muted">
              <Image
                src={placement.url}
                alt=""
                fill
                sizes={`${Math.round(placement.width)}px`}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      ))}
      <div className="welcome-gradient-overlay absolute inset-0" />
    </div>
  );
}
