'use client'
import { useEffect, useRef, useState } from 'react'

type Chapter = { title: string; fileId: number }

export function AudioPlayer(props: { bookId: number; chapters: Chapter[]; start?: { chapter?: number; seconds?: number } }) {
  const [current, setCurrent] = useState(props.start?.chapter ?? 0)
  const audio = useRef<HTMLAudioElement>(null)
  const resumeAt = useRef(props.start?.seconds ?? 0)

  useEffect(() => {
    const id = setInterval(() => {
      const a = audio.current
      if (!a || a.paused) return
      fetch('/api/progreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: props.bookId, chapter: current, seconds: Math.floor(a.currentTime) }),
      })
    }, 15000)
    return () => clearInterval(id)
  }, [current, props.bookId])

  const ch = props.chapters[current]
  if (!ch) return null
  return (
    <div className="player">
      <p>Capítulo {current + 1}: {ch.title}</p>
      <audio
        ref={audio}
        key={ch.fileId}
        controls
        preload="metadata"
        src={`/api/descargas/${ch.fileId}?modo=stream`}
        onLoadedMetadata={(e) => {
          if (resumeAt.current) e.currentTarget.currentTime = resumeAt.current
          resumeAt.current = 0
        }}
        onEnded={() => current + 1 < props.chapters.length && setCurrent(current + 1)}
      />
      <ol>
        {props.chapters.map((c, i) => (
          <li key={c.fileId}>
            <button className={i === current ? 'link active' : 'link'} onClick={() => setCurrent(i)}>{c.title}</button>
          </li>
        ))}
      </ol>
    </div>
  )
}
