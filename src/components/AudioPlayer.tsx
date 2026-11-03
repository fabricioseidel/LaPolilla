'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import '@/app/(frontend)/styles/catalogo.css'

type Chapter = { title: string; fileId: number; durationSec?: number | null }
type Props = {
  bookId: number
  chapters: Chapter[]
  /** Avance guardado: { chapter, seconds } */
  start?: { chapter?: number; seconds?: number }
  bookTitle?: string
  authors?: string
  /** Portada para la cabecera y para los controles de la pantalla bloqueada. */
  cover?: { src: string; width?: number; height?: number }
  /** false para el equipo cuando revisa un libro que no compró: no guarda avance. */
  canSave?: boolean
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2]
const BACK = 15
const FORWARD = 30
const SPEED_KEY = 'polilla-velocidad'

/** 4:05 / 1:02:09 */
const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`
}
/** "4 minutos 5 segundos", para lectores de pantalla */
const spoken = (sec: number) => {
  const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  const parts = [
    h ? `${h} ${h === 1 ? 'hora' : 'horas'}` : '',
    m ? `${m} ${m === 1 ? 'minuto' : 'minutos'}` : '',
    r || (!h && !m) ? `${r} ${r === 1 ? 'segundo' : 'segundos'}` : '',
  ]
  return parts.filter(Boolean).join(' ')
}
const speedLabel = (s: number) => `${String(s).replace('.', ',')}×`

const Icon = ({ children, size = 22 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

/**
 * Reproductor del audiolibro: capítulos con duración, velocidad 0,75×–2×, −15 s / +30 s,
 * continúa donde quedó (guarda cada 15 s, al pausar, al cambiar de capítulo y al salir)
 * y se controla desde la pantalla bloqueada (Media Session API).
 */
export function AudioPlayer({ bookId, chapters, start, bookTitle, authors, cover, canSave = true }: Props) {
  const startChapter = Math.min(Math.max(0, Math.floor(start?.chapter ?? 0)), Math.max(0, chapters.length - 1))
  const startSeconds = Math.max(0, start?.seconds ?? 0)

  const [current, setCurrent] = useState(startChapter)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(startSeconds)
  const [known, setKnown] = useState<Record<number, number>>({})
  const [rate, setRate] = useState(1)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [resumeNote, setResumeNote] = useState(startChapter > 0 || startSeconds > 0)

  const audio = useRef<HTMLAudioElement>(null)
  const pendingSeek = useRef(startSeconds)
  const autoplay = useRef(false)
  const loading = useRef(true)
  const lastSaved = useRef('')
  const currentRef = useRef(current)
  useEffect(() => {
    currentRef.current = current
  }, [current])

  const ch = chapters[current]
  const durationOf = useCallback((i: number) => known[i] ?? chapters[i]?.durationSec ?? 0, [known, chapters])
  const duration = durationOf(current)
  const total = chapters.every((_, i) => durationOf(i)) ? chapters.reduce((s, _, i) => s + durationOf(i), 0) : 0

  // ---- Guardar avance ----
  const save = useCallback(
    (chapter: number, seconds: number, beacon = false) => {
      if (!canSave) return
      const body = JSON.stringify({ bookId, chapter, seconds: Math.floor(seconds) })
      if (body === lastSaved.current) return
      lastSaved.current = body
      if (beacon && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon('/api/progreso', new Blob([body], { type: 'application/json' }))
        return
      }
      fetch('/api/progreso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {
        lastSaved.current = ''
      })
    },
    [bookId, canSave],
  )

  // Cada 15 s mientras suena.
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const a = audio.current
      if (a && !loading.current) save(currentRef.current, a.currentTime)
    }, 15000)
    return () => clearInterval(id)
  }, [playing, save])

  // Al cerrar la pestaña, cambiar de app o salir de la página.
  useEffect(() => {
    const flush = () => {
      const a = audio.current
      if (a && !loading.current && a.currentTime > 0) save(currentRef.current, a.currentTime, true)
    }
    const onVisibility = () => document.visibilityState === 'hidden' && flush()
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      flush()
    }
  }, [save])

  // ---- Velocidad (se recuerda en este navegador) ----
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(SPEED_KEY))
      if (SPEEDS.includes(saved)) setRate(saved)
    } catch {}
  }, [])
  useEffect(() => {
    const a = audio.current
    if (!a) return
    a.defaultPlaybackRate = rate
    a.playbackRate = rate
  }, [rate])
  const changeRate = (r: number) => {
    setRate(r)
    try {
      localStorage.setItem(SPEED_KEY, String(r))
    } catch {}
  }

  // ---- Acciones ----
  const updatePosition = useCallback(() => {
    const a = audio.current
    if (!a || !('mediaSession' in navigator) || !Number.isFinite(a.duration) || !navigator.mediaSession.setPositionState) return
    try {
      navigator.mediaSession.setPositionState({ duration: a.duration, playbackRate: a.playbackRate, position: Math.min(a.currentTime, a.duration) })
    } catch {}
  }, [])

  const goTo = useCallback(
    (i: number, opts: { play?: boolean; at?: number } = {}) => {
      if (i < 0 || i >= chapters.length) return
      const a = audio.current
      const at = opts.at ?? 0
      setResumeNote(false)
      setError(false)
      if (i === currentRef.current && a) {
        a.currentTime = at
        setTime(at)
        save(i, at)
        if (opts.play) a.play().catch(() => {})
        return
      }
      autoplay.current = opts.play ?? Boolean(a && !a.paused)
      pendingSeek.current = at
      loading.current = true
      setCurrent(i)
      setTime(at)
      save(i, at)
      setAnnounce(`Capítulo ${i + 1} de ${chapters.length}: ${chapters[i].title}`)
    },
    [chapters, save],
  )

  const skip = useCallback(
    (delta: number) => {
      const a = audio.current
      if (!a) return
      const max = Number.isFinite(a.duration) ? a.duration : durationOf(currentRef.current) || Infinity
      a.currentTime = Math.max(0, Math.min(max, a.currentTime + delta))
      setTime(a.currentTime)
    },
    [durationOf],
  )

  const toggle = () => {
    const a = audio.current
    if (!a) return
    if (a.paused) a.play().catch(() => setError(true))
    else a.pause()
  }

  // ---- Media Session: controles en la pantalla bloqueada y en los audífonos ----
  useEffect(() => {
    if (!ch || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    try {
      ms.metadata = new MediaMetadata({
        title: ch.title,
        artist: authors ?? '',
        album: bookTitle ?? '',
        artwork: cover
          ? [{ src: cover.src, ...(cover.width && cover.height ? { sizes: `${cover.width}x${cover.height}` } : {}) }]
          : [],
      })
    } catch {}
    const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', () => void audio.current?.play().catch(() => {})],
      ['pause', () => audio.current?.pause()],
      ['seekbackward', (d) => skip(-(d.seekOffset || BACK))],
      ['seekforward', (d) => skip(d.seekOffset || FORWARD)],
      [
        'seekto',
        (d) => {
          if (audio.current && d.seekTime != null) {
            audio.current.currentTime = d.seekTime
            setTime(d.seekTime)
          }
        },
      ],
      ['previoustrack', current > 0 ? () => goTo(current - 1, { play: true }) : null],
      ['nexttrack', current < chapters.length - 1 ? () => goTo(current + 1, { play: true }) : null],
    ]
    for (const [action, handler] of handlers)
      try {
        ms.setActionHandler(action, handler)
      } catch {}
    return () => {
      for (const [action] of handlers)
        try {
          ms.setActionHandler(action, null)
        } catch {}
    }
  }, [ch, current, chapters.length, authors, bookTitle, cover, goTo, skip])

  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [playing])

  if (!ch) return null
  const progress = duration ? Math.min(100, (time / duration) * 100) : 0

  return (
    <div className="rep" role="region" aria-label={`Reproductor del audiolibro${bookTitle ? ` ${bookTitle}` : ''}`}>
      <audio
        ref={audio}
        src={`/api/descargas/${ch.fileId}?modo=stream`}
        preload="metadata"
        onLoadStart={() => {
          loading.current = true
          setPlaying(false)
        }}
        onLoadedMetadata={(e) => {
          const a = e.currentTarget
          a.defaultPlaybackRate = rate
          a.playbackRate = rate
          if (Number.isFinite(a.duration)) setKnown((k) => (k[current] === a.duration ? k : { ...k, [current]: a.duration }))
          if (pendingSeek.current) {
            a.currentTime = Math.min(pendingSeek.current, Number.isFinite(a.duration) ? Math.max(0, a.duration - 1) : pendingSeek.current)
            pendingSeek.current = 0
          }
          loading.current = false
          setTime(a.currentTime)
          updatePosition()
          if (autoplay.current) {
            autoplay.current = false
            a.play().catch(() => {})
          }
        }}
        onTimeUpdate={(e) => {
          if (!loading.current) setTime(e.currentTarget.currentTime)
        }}
        onPlay={() => {
          setPlaying(true)
          setResumeNote(false)
          updatePosition()
        }}
        onPause={(e) => {
          setPlaying(false)
          if (!loading.current) save(current, e.currentTarget.currentTime)
          updatePosition()
        }}
        onSeeked={updatePosition}
        onRateChange={updatePosition}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => {
          setBuffering(false)
          setError(false)
        }}
        onCanPlay={() => setBuffering(false)}
        onEnded={() => {
          if (current + 1 < chapters.length) goTo(current + 1, { play: true })
          else {
            setPlaying(false)
            save(current, 0)
            setAnnounce('Terminaste el audiolibro. ¡Gracias por escuchar!')
          }
        }}
        onError={() => {
          setError(true)
          setBuffering(false)
          setPlaying(false)
        }}
      />

      <div className="rep-ahora">
        <div className="rep-cabecera">
          {cover && <img src={cover.src} alt="" width={cover.width} height={cover.height} />}
          <div>
            <p className="cat-eyebrow">
              Capítulo {current + 1} de {chapters.length}
            </p>
            <p className="rep-capitulo-actual">{ch.title}</p>
          </div>
        </div>

        {resumeNote && (
          <p className="rep-retomar">
            Retomas donde quedaste: capítulo {startChapter + 1}, minuto {clock(startSeconds)}.
            <button type="button" onClick={() => goTo(0, { at: 0 })}>
              Empezar desde el principio
            </button>
          </p>
        )}

        <div>
          <input
            type="range"
            className="rep-barra"
            min={0}
            max={Math.max(1, Math.floor(duration))}
            step={1}
            value={Math.min(Math.floor(time), Math.max(1, Math.floor(duration)))}
            disabled={!duration}
            onChange={(e) => {
              const v = Number(e.target.value)
              setTime(v)
              if (audio.current) audio.current.currentTime = v
            }}
            aria-label="Posición en el capítulo"
            aria-valuetext={`${spoken(time)} de ${spoken(duration)}`}
            style={{ '--avance': `${progress}%` } as CSSProperties}
          />
          <p className="rep-tiempos" aria-hidden="true">
            <span>{clock(time)}</span>
            <span>{duration ? `−${clock(duration - time)}` : '--:--'}</span>
          </p>
        </div>

        <div className="rep-controles">
          <button type="button" className="rep-boton" onClick={() => goTo(current - 1)} disabled={current === 0} aria-label="Capítulo anterior">
            <Icon>
              <path d="M6 5v14" />
              <path d="M18 6 9 12l9 6V6Z" fill="currentColor" />
            </Icon>
          </button>
          <button type="button" className="rep-boton rep-boton--salto" onClick={() => skip(-BACK)} aria-label={`Retroceder ${BACK} segundos`}>
            <Icon size={34}>
              <path d="M4 12a8 8 0 1 0 2.4-5.7" />
              <path d="M4 4v4.5h4.5" />
            </Icon>
            <span aria-hidden="true">{BACK}</span>
          </button>
          <button type="button" className="rep-boton rep-boton--play" onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'}>
            {playing ? (
              <Icon size={28}>
                <rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
                <rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
              </Icon>
            ) : (
              <Icon size={28}>
                <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" />
              </Icon>
            )}
          </button>
          <button type="button" className="rep-boton rep-boton--salto" onClick={() => skip(FORWARD)} aria-label={`Avanzar ${FORWARD} segundos`}>
            <Icon size={34}>
              <path d="M20 12a8 8 0 1 1-2.4-5.7" />
              <path d="M20 4v4.5h-4.5" />
            </Icon>
            <span aria-hidden="true">{FORWARD}</span>
          </button>
          <button
            type="button"
            className="rep-boton"
            onClick={() => goTo(current + 1)}
            disabled={current === chapters.length - 1}
            aria-label="Capítulo siguiente"
          >
            <Icon>
              <path d="M18 5v14" />
              <path d="M6 6l9 6-9 6V6Z" fill="currentColor" />
            </Icon>
          </button>
        </div>

        <div className="rep-ajustes">
          <div className="rep-velocidad">
            <label htmlFor={`rep-velocidad-${bookId}`}>Velocidad</label>
            <select id={`rep-velocidad-${bookId}`} className="cat-select" value={rate} onChange={(e) => changeRate(Number(e.target.value))}>
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {speedLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <p className="rep-estado" aria-live="polite">
            {buffering && !error ? 'Cargando…' : ''}
          </p>
        </div>

        {error && (
          <p className="rep-error" role="alert">
            No pudimos cargar este capítulo. Revisa tu conexión e inténtalo otra vez.
            <button
              type="button"
              onClick={() => {
                setError(false)
                pendingSeek.current = time
                autoplay.current = true
                audio.current?.load()
              }}
            >
              Reintentar
            </button>
          </p>
        )}
        <p className="cat-sr" aria-live="polite">
          {announce}
        </p>
      </div>

      <div className="rep-capitulos">
        <h3>
          Capítulos{' '}
          <span>
            {chapters.length}
            {total ? ` · ${clock(total)}` : ''}
          </span>
        </h3>
        <ol>
          {chapters.map((c, i) => {
            const d = durationOf(i)
            return (
              <li key={`${c.fileId}-${i}`}>
                <button
                  type="button"
                  className="rep-capitulo"
                  aria-current={i === current ? 'true' : undefined}
                  onClick={() => (i === current ? toggle() : goTo(i, { play: true }))}
                >
                  <span className="rep-capitulo-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>
                    <span className="cat-sr">Capítulo {i + 1}: </span>
                    {c.title}
                  </span>
                  <span className="rep-capitulo-dur">
                    {d ? (
                      <>
                        <span aria-hidden="true">{clock(d)}</span>
                        <span className="cat-sr">, {spoken(d)}</span>
                      </>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
