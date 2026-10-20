import { useEffect, useRef, useState, type ReactNode } from 'react'
import './App.css'

type IconName = 'activity' | 'audio' | 'chevron' | 'circle' | 'disc' | 'folder' | 'layers' | 'mic' | 'more' | 'pause' | 'play' | 'plus' | 'settings' | 'spark' | 'upload' | 'volume'

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const shared = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const, 'aria-hidden': true as const,
  }
  const paths: Record<IconName, ReactNode> = {
    activity: <path d="M3 12h3l3-8 5 16 3-8h4" />,
    audio: <><path d="M3 10v4M7 6v12M11 3v18M15 7v10M19 10v4M22 11v2" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    circle: <circle cx="12" cy="12" r="8" />,
    disc: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v6" /></>,
    folder: <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />,
    layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    pause: <><path d="M9 5v14M15 5v14" /></>,
    play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.9h-3l-.3-1.9a8 8 0 0 1-1.7-1l-1.7.7-1.5-2.6 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.5-2.6 1.7.7a8 8 0 0 1 1.7-1l.3-1.9h3l.3 1.9a8 8 0 0 1 1.7 1l1.7-.7 1.5 2.6-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1) scale(1.08)" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2z" /><path d="m19 15 1.1 2.1L22 18l-1.9.9L19 21l-1-2.1-2-.9 2-.9z" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
    volume: <><path d="M4 10v4h4l5 4V6l-5 4z" /><path d="M17 9a5 5 0 0 1 0 6M19 6a9 9 0 0 1 0 12" /></>,
  }
  return <svg {...shared}>{paths[name]}</svg>
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  return Math.floor(seconds / 60).toString().padStart(2, '0') + ':' + Math.floor(seconds % 60).toString().padStart(2, '0')
}

function makeWaveform(count: number, seed: number) {
  return Array.from({ length: count }, (_, index) => {
    const envelope = 0.28 + 0.72 * Math.abs(Math.sin(index * 0.095 + seed))
    const detail = 0.25 + 0.75 * Math.abs(Math.sin(index * 0.41 + seed * 2.2))
    return Math.max(5, Math.round(envelope * detail * 100))
  })
}

const waveformA = makeWaveform(112, 1.4)
const waveformB = makeWaveform(112, 2.8)
const spectrumBars = Array.from({ length: 54 }, (_, index) => {
  const base = Math.abs(Math.sin(index * 0.36) * Math.cos(index * 0.13))
  return Math.round(10 + base * 72 + (index % 7) * 2)
})

function Deck({ deck, accent }: { deck: 'A' | 'B'; accent: 'lime' | 'violet' }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [fileName, setFileName] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio || !audioUrl) {
      inputRef.current?.click()
      return
    }
    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch {
        setLoadError('Playback was blocked. Try pressing play again.')
      }
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  function loadFile(file?: File) {
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      setLoadError('Choose an audio file to load this deck.')
      return
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(URL.createObjectURL(file))
    setFileName(file.name)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    setLoadError('')
  }

  return (
    <section className={'deck-card deck-' + accent} aria-label={'Deck ' + deck}>
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
        onError={() => { if (audioUrl) setLoadError('This file could not be played by your browser.') }}
      />
      <input ref={inputRef} className="visually-hidden" type="file" accept="audio/*" onChange={(event) => loadFile(event.target.files?.[0])} aria-label={'Choose audio for deck ' + deck} />
      <div className="deck-topline">
        <div className="deck-identity"><span className="deck-letter">{deck}</span><div><p className="eyebrow">PLAYER {deck === 'A' ? '01' : '02'}</p><h3>Deck {deck}</h3></div></div>
        <span className="deck-status"><span />{isPlaying ? 'PLAYING' : audioUrl ? 'LOADED' : 'STANDBY'}</span>
      </div>
      <button className="track-select" type="button" onClick={() => inputRef.current?.click()}>
        <span className="track-art"><Icon name={fileName ? 'audio' : 'disc'} size={22} /></span>
        <span className="track-copy"><strong>{fileName || 'Load a track'}</strong><small>{fileName ? 'Local audio · stays on this device' : 'Choose an audio file to begin'}</small></span>
        <Icon name={fileName ? 'more' : 'plus'} size={19} />
      </button>
      <div className="deck-waveform" aria-label="Illustrative waveform preview">
        <div className="waveform-grid" />
        {(deck === 'A' ? waveformA : waveformB).map((height, index) => (
          <span key={deck + '-' + index} className={'wave-bar' + (duration && index / 112 <= currentTime / duration ? ' is-played' : '')} style={{ height: height + '%' }} />
        ))}
        <span className="playhead" style={{ left: (duration ? (currentTime / duration) * 100 : 0) + '%' }} />
      </div>
      <div className="deck-time"><span>{formatTime(currentTime)}</span><span>{duration ? formatTime(duration) : '00:00'}</span></div>
      <input className="seek-slider" type="range" min={0} max={duration || 1} step={0.1} value={Math.min(currentTime, duration || 1)} onChange={(event) => {
        const nextTime = Number(event.target.value)
        if (audioRef.current) audioRef.current.currentTime = nextTime
        setCurrentTime(nextTime)
      }} disabled={!audioUrl || !duration} aria-label={'Seek deck ' + deck} />
      <div className="deck-controls">
        <button className="icon-button" type="button" aria-label={'Return deck ' + deck + ' to start'} title="Return to start" onClick={() => {
          if (audioRef.current) audioRef.current.currentTime = 0
          setCurrentTime(0)
        }}><Icon name="circle" size={18} /></button>
        <button className="deck-play" type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause deck ' + deck : 'Play deck ' + deck}><Icon name={isPlaying ? 'pause' : 'play'} size={20} /></button>
        <button className="icon-button" type="button" aria-label={'Load audio for deck ' + deck} title="Load audio" onClick={() => inputRef.current?.click()}><Icon name="upload" size={18} /></button>
      </div>
      {loadError && <p className="inline-error" role="status">{loadError}</p>}
    </section>
  )
}

function App() {
  const [masterLevel, setMasterLevel] = useState(78)
  const [crossfade, setCrossfade] = useState(50)
  const [activeSource, setActiveSource] = useState<'files' | 'mic'>('files')
  const [showNotice, setShowNotice] = useState(true)

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#workspace" aria-label="Sound Visualizer home"><span className="brand-mark"><Icon name="audio" size={22} /></span><span className="brand-name">SOUND<span>VISUALIZER</span></span></a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Workspace navigation">
          <a className="nav-item active" href="#workspace"><Icon name="layers" size={18} />Studio <span className="nav-shortcut">01</span></a>
          <a className="nav-item" href="#analysis"><Icon name="activity" size={18} />Analysis <span className="soon-tag">SOON</span></a>
          <a className="nav-item" href="#library"><Icon name="folder" size={18} />Library <span className="soon-tag">SOON</span></a>
        </nav>
        <div className="sidebar-label source-label">INPUT SOURCES</div>
        <div className="source-switch" role="group" aria-label="Audio input source">
          <button type="button" className={activeSource === 'files' ? 'source-option selected' : 'source-option'} onClick={() => setActiveSource('files')}><Icon name="folder" size={16} /> Files</button>
          <button type="button" className={activeSource === 'mic' ? 'source-option selected' : 'source-option'} onClick={() => setActiveSource('mic')}><Icon name="mic" size={16} /> Microphone</button>
        </div>
        <div className="source-note">{activeSource === 'files' ? 'Load local audio into either deck. Files are not uploaded.' : 'Microphone capture will be added with the audio engine.'}</div>
        <div className="sidebar-bottom">
          <div className="local-status"><span className="status-dot" /><div><strong>LOCAL SESSION</strong><small>No account required</small></div></div>
          <button className="settings-button" type="button" onClick={() => setShowNotice((visible) => !visible)}><Icon name="settings" size={17} /> Project notes <Icon name="chevron" size={15} /></button>
        </div>
      </aside>

      <section className="workspace" id="workspace">
        <header className="topbar">
          <div className="breadcrumbs"><span>WORKSPACE</span><Icon name="chevron" size={13} /><strong>Studio</strong></div>
          <div className="topbar-right"><span className="prototype-pill"><span />FOUNDATION BUILD</span><button className="icon-button top-settings" aria-label="Project status" title="Project status" type="button" onClick={() => setShowNotice((visible) => !visible)}><Icon name="settings" size={18} /></button></div>
        </header>
        <div className="page-content">
          <section className="welcome-row">
            <div><p className="eyebrow welcome-eyebrow">AUDIO WORKSTATION / 001</p><h1>Make sound <span>visible.</span></h1><p className="welcome-copy">A workspace for listening, exploring, and understanding audio.</p></div>
            <div className="session-chip"><span className="session-pulse" /><div><small>SESSION</small><strong>Untitled session</strong></div><button type="button" aria-label="Session options" onClick={() => setShowNotice((visible) => !visible)}><Icon name="more" size={18} /></button></div>
          </section>
          {showNotice && <div className="foundation-note"><Icon name="spark" size={17} /><p><strong>Foundation build</strong><span>Local file playback is working. Live analysis, EQ processing, and microphone routing are the next milestones.</span></p><button type="button" aria-label="Dismiss project note" onClick={() => setShowNotice(false)}>×</button></div>}

          <section className="decks-section" aria-label="Audio decks">
            <div className="section-heading"><div><span className="section-index">01</span><h2>Players</h2><span className="section-description">Two-deck listening setup</span></div><span className="tiny-label"><span className="tiny-dot" /> LOCAL AUDIO</span></div>
            <div className="decks-grid"><Deck deck="A" accent="lime" /><Deck deck="B" accent="violet" /></div>
          </section>

          <section className="mixer-section" aria-label="Mixer controls">
            <div className="section-heading"><div><span className="section-index">02</span><h2>Master mixer</h2><span className="section-description">Control surface preview</span></div><span className="prototype-label">ROUTING NOT CONNECTED</span></div>
            <div className="mixer-panel">
              <div className="mixer-channel">
                <div className="channel-title"><span className="channel-marker marker-a" />DECK A <small>CHANNEL 01</small></div>
                <div className="eq-row">
                  <label><span>HIGH</span><input type="range" min="-12" max="12" defaultValue="0" aria-label="Deck A high EQ preview" /><small>0 dB</small></label>
                  <label><span>MID</span><input type="range" min="-12" max="12" defaultValue="0" aria-label="Deck A mid EQ preview" /><small>0 dB</small></label>
                  <label><span>LOW</span><input type="range" min="-12" max="12" defaultValue="0" aria-label="Deck A low EQ preview" /><small>0 dB</small></label>
                </div>
                <div className="channel-foot"><span>GAIN</span><div className="gain-track"><span style={{ width: '68%' }} /></div><span>0.0</span></div>
              </div>
              <div className="mixer-divider"><span>VS</span></div>
              <div className="mixer-channel">
                <div className="channel-title"><span className="channel-marker marker-b" />DECK B <small>CHANNEL 02</small></div>
                <div className="eq-row">
                  <label><span>HIGH</span><input type="range" min="-12" max="12" defaultValue="0" aria-label="Deck B high EQ preview" /><small>0 dB</small></label>
                  <label><span>MID</span><input type="range" min="-12" max="12" defaultValue="0" aria-label="Deck B mid EQ preview" /><small>0 dB</small></label>
                  <label><span>LOW</span><input type="range" min="-12" max="12" defaultValue="0" aria-label="Deck B low EQ preview" /><small>0 dB</small></label>
                </div>
                <div className="channel-foot"><span>GAIN</span><div className="gain-track"><span style={{ width: '68%' }} /></div><span>0.0</span></div>
              </div>
              <div className="master-controls">
                <div className="master-heading"><Icon name="volume" size={17} /><span>MASTER</span></div>
                <div className="master-value">{masterLevel}<small>%</small></div>
                <input className="master-slider" type="range" min="0" max="100" value={masterLevel} onChange={(event) => setMasterLevel(Number(event.target.value))} aria-label="Master level preview" />
                <div className="master-scale"><span>0</span><span>100</span></div>
                <div className="master-meter"><span style={{ height: masterLevel + '%' }} /><span style={{ height: Math.max(6, masterLevel - 12) + '%' }} /></div>
              </div>
              <div className="crossfader">
                <div className="crossfader-label"><span>CROSSFADER</span><small><b>A</b> MIX <b>B</b></small></div>
                <input type="range" min="0" max="100" value={crossfade} onChange={(event) => setCrossfade(Number(event.target.value))} aria-label="Crossfader preview" />
                <div className="crossfader-scale"><span>A</span><span>CENTER</span><span>B</span></div>
              </div>
            </div>
          </section>

          <section className="visual-section" id="analysis" aria-label="Visualization preview">
            <div className="section-heading"><div><span className="section-index">03</span><h2>Signal monitor</h2><span className="section-description">Visualization canvas preview</span></div><span className="prototype-label">DEMO DATA</span></div>
            <div className="visual-panel">
              <div className="visual-header"><div><Icon name="activity" size={17} /><span>FREQUENCY SPECTRUM</span></div><span>20 Hz — 20 kHz</span></div>
              <div className="spectrum-chart" aria-label="Decorative spectrum preview; not connected to audio yet">
                <div className="spectrum-grid"><span>0 dB</span><span>-12 dB</span><span>-24 dB</span><span>-36 dB</span><span>-48 dB</span></div>
                <div className="spectrum-bars">{spectrumBars.map((height, index) => <span key={index} className={'spectrum-bar ' + (index < 18 ? 'low' : index < 37 ? 'mid' : 'high')} style={{ height: height + '%' }} />)}</div>
                <div className="spectrum-labels"><span>20 Hz</span><span>60 Hz</span><span>250 Hz</span><span>1 kHz</span><span>5 kHz</span><span>20 kHz</span></div>
              </div>
              <div className="visual-footer"><span><i className="legend-low" />LOW</span><span><i className="legend-mid" />MID</span><span><i className="legend-high" />HIGH</span><p>Illustrative data · Audio analysis comes next</p></div>
            </div>
          </section>
          <footer className="app-footer"><span>SOUND VISUALIZER <b>·</b> FOUNDATION 0.1</span><span>BUILT FOR CURIOSITY <Icon name="spark" size={13} /></span></footer>
        </div>
      </section>
    </main>
  )
}

export default App
