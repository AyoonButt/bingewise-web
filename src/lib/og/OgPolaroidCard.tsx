import React from 'react'

export interface OgWatchlistItem {
  title: string
  posterPath: string | null
}

export interface OgWatchlistData {
  id: number
  name: string
  description?: string | null
  itemCount: number
  accentColor: string
  items: OgWatchlistItem[]
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

function posterUrl(path: string | null, size = 'w500'): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null
}

const FALLBACK_ACCENT = '#1565C0'

function normalizeAccent(color: string): string {
  const c = color.trim().toLowerCase()
  const eight = c.match(/^#([0-9a-f]{8})$/)
  if (eight) return `#${eight[1].slice(2)}`
  return /^#[0-9a-f]{6}$/.test(c) ? c : FALLBACK_ACCENT
}

/**
 * Deterministic per-watchlist scatter so a given watchlist always renders the
 * same card. Mirrors the polaroid scatter math from the Android story card.
 */
function scatterPolaroid(watchlistId: number, index: number) {
  const mix = watchlistId * 31 + index
  const r1 = (((mix * 37 + 11) % 997) % 100 + 100) % 100
  const r2 = (((mix * 13 + 29) % 991) % 100 + 100) % 100
  const r3 = (((mix * 23 + 47) % 983) % 100 + 100) % 100
  const r4 = (((mix * 31 + 7) % 977) % 100 + 100) % 100
  return { r1, r2, r3, r4 }
}

function polaroidLayout(watchlistId: number, index: number, count: number, regionW: number, regionH: number) {
  const { r1, r2, r3, r4 } = scatterPolaroid(watchlistId, index)
  const baseW = count <= 2 ? 250 : count <= 4 ? 210 : count <= 6 ? 190 : count <= 9 ? 165 : 150
  const w = baseW * (0.78 + r1 * 0.005)
  const cardH = w / 0.66 + 24
  const halfW = regionW / 2
  const halfH = regionH / 2
  const dxMax = Math.max(0, halfW - (w / 2 + 24))
  const dyMax = Math.max(0, halfH - (cardH / 2 + 12))
  const dx = ((r3 - 50) / 50) * Math.min(w * 1.2, dxMax)
  const dy = ((r4 - 50) / 50) * Math.min(w * 1.5, dyMax)
  return {
    left: halfW + dx - w / 2,
    top: halfH + dy - cardH / 2,
    width: w,
    cardH,
    rotation: -25 + r2 * 0.5,
    imageW: w - 10,
    imageH: (w - 10) / 0.66
  }
}

function Polaroid({
  item,
  layout
}: {
  item: OgWatchlistItem
  layout: ReturnType<typeof polaroidLayout>
}) {
  const src = posterUrl(item.posterPath)
  return (
    <div
      style={{
        position: 'absolute',
        left: layout.left,
        top: layout.top,
        width: layout.width,
        height: layout.cardH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        padding: 5,
        transform: `rotate(${layout.rotation}deg)`
      }}
    >
      {src ? (
        <img
          src={src}
          width={layout.imageW}
          height={layout.imageH}
          style={{ borderRadius: 4, objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: layout.imageW,
            height: layout.imageH,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundColor: '#E7E7EE',
            borderRadius: 4
          }}
        >
          <div style={{ fontSize: 14, lineHeight: 1.3, color: '#6B7280', fontWeight: 500, padding: 8, textAlign: 'center' }}>
            {item.title || 'No poster'}
          </div>
        </div>
      )}
    </div>
  )
}

export function OgPolaroidCard({ watchlist }: { watchlist: OgWatchlistData }) {
  const accent = normalizeAccent(watchlist.accentColor)
  const count = watchlist.items.length
  const regionW = 660
  const regionH = 470

  const leftPanel = (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 18,
        paddingLeft: 56,
        paddingRight: 8
      }}
    >
      <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 20, letterSpacing: 8, fontWeight: 700 }}>
        BINGEWISE
      </div>
      <div style={{ color: '#FFFFFF', fontSize: 54, lineHeight: 1.08, fontWeight: 900 }}>
        {watchlist.name}
      </div>
      {watchlist.description ? (
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20, lineHeight: 1.35 }}>
          {watchlist.description}
        </div>
      ) : null}
      <div
        style={{
          alignSelf: 'flex-start',
          borderRadius: 999,
          backgroundColor: `${accent}D9`,
          padding: '10px 24px',
          color: '#FFFFFF',
          fontSize: 16,
          letterSpacing: 3,
          fontWeight: 700,
          marginTop: 6
        }}
      >
        {`${watchlist.itemCount} TITLES`}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 500, marginTop: 6 }}>
        Check out this watchlist on BingeWise
      </div>
    </div>
  )

  const scatter =
    count === 0 ? null : (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: regionW,
          height: regionH,
          alignSelf: 'center',
          marginRight: 40
        }}
      >
        {watchlist.items.slice(0, 12).map((item, i) => (
          <Polaroid
            key={i}
            item={item}
            layout={polaroidLayout(watchlist.id, i, count, regionW, regionH)}
          />
        ))}
      </div>
    )

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        overflow: 'hidden',
        backgroundImage: `linear-gradient(to bottom, ${accent}59, #0E0E13, #0E0E13, ${accent}73)`,
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {leftPanel}
      {scatter}
    </div>
  )
}