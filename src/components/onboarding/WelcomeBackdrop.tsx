"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

// Curated TMDB posters shared with the mobile welcome backdrop. Keep both lists in sync.
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
  "https://image.tmdb.org/t/p/w342/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
  "https://image.tmdb.org/t/p/w342/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
  "https://image.tmdb.org/t/p/w342/q719jXXEzOoYaps6babgKnONONX.jpg",
  "https://image.tmdb.org/t/p/w342/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
  "https://image.tmdb.org/t/p/w342/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
  "https://image.tmdb.org/t/p/w342/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
  "https://image.tmdb.org/t/p/w342/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg",
  "https://image.tmdb.org/t/p/w342/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
  "https://image.tmdb.org/t/p/w342/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
  "https://image.tmdb.org/t/p/w342/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
  "https://image.tmdb.org/t/p/w342/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg",
  "https://image.tmdb.org/t/p/w342/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg",
  "https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
  "https://image.tmdb.org/t/p/w342/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
  "https://image.tmdb.org/t/p/w342/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
  "https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
  "https://image.tmdb.org/t/p/w342/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
  "https://image.tmdb.org/t/p/w342/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
  "https://image.tmdb.org/t/p/w342/74xTEgt7R36Fpooo50r9T25onhq.jpg",
  "https://image.tmdb.org/t/p/w342/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
  "https://image.tmdb.org/t/p/w342/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
  "https://image.tmdb.org/t/p/w342/lqoMzCcZYEFK729d6qzt349fB4o.jpg",
  "https://image.tmdb.org/t/p/w342/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
  "https://image.tmdb.org/t/p/w342/pThyQovXQrw2m0s9x82twj48Jq4.jpg",
  "https://image.tmdb.org/t/p/w342/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
  "https://image.tmdb.org/t/p/w342/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
];

interface Placement {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
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
    // Tighter horizontal spacing fits another column of polaroids into the backdrop.
    const stepX = cardWidth * 0.55;
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

      return {
        url: posters[index % posters.length],
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        rotation,
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
              "--welcome-rotation": `${placement.rotation}deg`,
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
