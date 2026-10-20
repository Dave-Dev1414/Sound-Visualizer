import { useEffect, useRef, useState, type ReactNode } from 'react'
import './App.css'

type IconName = 'audio' | 'folder' | 'mic' | 'play' | 'pause' | 'back' | 'forward' | 'upload' | 'settings' | 'chevron' | 'activity' | 'sliders' | 'wave' | 'disc' | 'plus' | 'headphones' | 'panel' | 'more' | 'music' | 'check' | 'volume'
function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    audio: <><path d="M3 10v4M7 6v12M11 3v18M15 7v10M19 10v4M22 11v2" /></>,
    folder: <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>,
    play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" />,
    pause: <><path d="M9 5v14M15 5v14" /></>,
    back: <><path d="M6 5v14M19 6l-10 6 10 6z" /></>,
    forward: <><path d="M18 5v14M5 6l10 6-10 6z" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19 15 2 1-2 3-2-1-2 1v2h-4v-2l-2-1-2 1-2-3 2-1v-2l-2-1 2-3 2 1 2-1V7h4v2l2 1 2-1 2 3-2 1z" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    activity: <path d="M3 12h3l3-8 5 16 3-8h4" />,
    sliders: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
    wave: <path d="M2 12h2l2-5 3 10 3-14 3 18 3-9 2 4h2" />,
    disc: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    headphones: <><path d="M3 13v-1a9 9 0 0 1 18 0v1" /><rect x="3" y="12" width="4" height="7" rx="2" /><rect x="17" y="12" width="4" height="7" rx="2" /></>,
    panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    volume: <><path d="M4 10v4h4l5 4V6l-5 4z" /><path d="M17 9a5 5 0 0 1 0 6M19 6a9 9 0 0 1 0 12" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
function timeLabel(value: number) {
  if (!Number.isFinite(value) || value < 0) return '00:00'
  return Math.floor(value / 60).toString().padStart(2, '0') + ':' + Math.floor(value % 60).toString().padStart(2, '0')
}
function makeBars(count: number, seed: number) {
  return Array.from({ length: count }, (_, i) => Math.max(5, Math.round((.28 + .72 * Math.abs(Math.sin(i * .095 + seed))) * (.25 + .75 * Math.abs(Math.sin(i * .41 + seed * 2.2))) * 100)))
}
const demoSpectrum = Array.from({ length: 76 }, (_, i) => Math.round(8 + Math.abs(Math.sin(i * .21) * Math.cos(i * .083)) * 75 + (i % 5) * 2))

function Deck({ deck, accent }: { deck: 'A' | 'B'; accent: 'lime' | 'violet' }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [fileName, setFileName] = useState('')
  const [url, setUrl] = useState('')
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [error, setError] = useState('')
  const bars = useRef(makeBars(112, deck === 'A' ? 1.4 : 2.8)).current
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  function loadFile(file?: File) {
    if (!file) return
    if (!file.type.startsWith('audio/')) { setError('Choose an audio file.'); return }
    if (url) URL.revokeObjectURL(url)
    setUrl(URL.createObjectURL(file)); setFileName(file.name); setCurrent(0); setDuration(0); setPlaying(false); setError('')
  }
  async function togglePlay() {
    const audio = audioRef.current
    if (!audio || !url) { fileRef.current?.click(); return }
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); setError('') }
      catch { setError('Playback could not start. Try again.') }
    } else { audio.pause(); setPlaying(false) }
  }
  return <section className={'deck-strip deck-' + accent} aria-label={'Deck ' + deck}>
    <audio ref={audioRef} src={url || undefined} onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)} onEnded={() => setPlaying(false)} onError={() => { if (url) setError('This audio file could not be played.') }} />
    <input ref={fileRef} className="visually-hidden" type="file" accept="audio/*" aria-label={'Choose audio for deck ' + deck} onChange={e => loadFile(e.target.files?.[0])} />
    <div className="deck-heading"><span className="deck-chip">{deck}</span><div className="deck-track-info"><strong title={fileName}>{fileName || 'Empty deck'}</strong><span>{playing ? 'PLAYING NOW' : fileName ? 'LOCAL AUDIO' : 'LOAD A TRACK TO START'}</span></div><button className="mini-icon" type="button" title="Load track" aria-label={'Load track for deck ' + deck} onClick={() => fileRef.current?.click()}><Icon name="folder" /></button></div>
    <div className="deck-waveform" aria-label="Illustrative waveform preview"><div className="wave-grid" />{bars.map((height, i) => <span key={i} className={'wave-bar' + (duration && i / bars.length <= current / duration ? ' played' : '')} style={{ height: height + '%' }} />)}<span className="wave-cursor" style={{ left: (duration ? current / duration * 100 : 0) + '%' }} /></div>
    <div className="deck-time"><span>{timeLabel(current)}</span><span>{duration ? timeLabel(duration) : '00:00'}</span></div>
    <input className="seek-slider" type="range" min={0} max={duration || 1} step={.1} value={Math.min(current, duration || 1)} disabled={!url || !duration} aria-label={'Seek deck ' + deck} onChange={e => { const t = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = t; setCurrent(t) }} />
    <div className="deck-actions"><button className="mini-icon" type="button" aria-label={'Return deck ' + deck + ' to start'} onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; setCurrent(0) }}><Icon name="back" /></button><button className="deck-play" type="button" aria-label={playing ? 'Pause deck ' + deck : 'Play deck ' + deck} onClick={togglePlay}><Icon name={playing ? 'pause' : 'play'} size={19} /></button><button className="mini-icon" type="button" aria-label={'Load audio for deck ' + deck} onClick={() => fileRef.current?.click()}><Icon name="upload" /></button></div>
    {error && <p className="inline-error" role="status">{error}</p>}
  </section>
}

function App() {
  const [master, setMaster] = useState(78)
  const [crossfade, setCrossfade] = useState(50)
  const [tab, setTab] = useState<'files' | 'input'>('files')
  const [browserOpen, setBrowserOpen] = useState(true)
  const [visualMode, setVisualMode] = useState<'spectrum' | 'waveform'>('spectrum')
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [projectName, setProjectName] = useState('Untitled session')
  return <main className="studio-shell">
    <header className="studio-topbar">
      <a className="brand" href="#studio" aria-label="Sound Visualizer home"><span className="brand-mark"><Icon name="audio" size={20} /></span><span className="brand-wordmark">SOUND<span>VISUALIZER</span></span></a>
      <div className="project-name"><span className="online-dot" /><input aria-label="Project name" value={projectName} onChange={e => setProjectName(e.target.value)} /><span className="project-state">LOCAL PROJECT</span></div>
      <div className="topbar-tools"><button className={'toolbar-button' + (browserOpen ? ' active' : '')} type="button" onClick={() => setBrowserOpen(v => !v)} title="Toggle browser" aria-label="Toggle browser"><Icon name="panel" /></button><button className="toolbar-button" type="button" onClick={() => setNoticeOpen(v => !v)} title="Workspace notes" aria-label="Workspace notes"><Icon name="settings" /></button><span className="version-pill">BETA 0.1</span></div>
    </header>
    <div className="transport-bar"><div className="transport-group"><button className="transport-button" type="button" title="Transport position preview" aria-label="Transport position preview"><Icon name="back" /></button><span className="transport-divider" /><span className="transport-time">00:00<span>.00</span></span><span className="transport-divider" /><span className="tempo-readout">120.0 <small>BPM · PREVIEW</small></span></div><div className="transport-status"><span className="status-light" /> READY <span className="transport-divider" /> 44.1 kHz <span className="transport-divider" /> STEREO</div></div>
    <div className={'studio-body' + (browserOpen ? '' : ' browser-hidden')}>
      {browserOpen && <aside className="browser-panel"><div className="panel-title"><span>BROWSER</span><button className="mini-icon" type="button" aria-label="Hide browser" onClick={() => setBrowserOpen(false)}><Icon name="panel" /></button></div><div className="browser-tabs"><button type="button" className={tab === 'files' ? 'selected' : ''} onClick={() => setTab('files')}><Icon name="folder" size={14} /> Files</button><button type="button" className={tab === 'input' ? 'selected' : ''} onClick={() => setTab('input')}><Icon name="mic" size={14} /> Input</button></div>{tab === 'files' ? <><div className="browser-section-label">SOURCE</div><div className="browser-item active"><Icon name="folder" /><span>Local audio</span><span className="item-count">2 DECKS</span></div><div className="browser-item"><Icon name="music" /><span>Supported files</span></div><div className="browser-hint">Load audio directly into either deck. Files stay on this device.</div></> : <><div className="browser-section-label">INPUT SOURCE</div><div className="browser-item"><Icon name="mic" /><span>Microphone</span><span className="coming-soon">NEXT</span></div><div className="browser-hint">Microphone capture will be connected with the audio engine.</div></>}<div className="browser-bottom"><span className="storage-icon"><Icon name="check" size={13} /></span><div><strong>LOCAL SESSION</strong><small>No account required</small></div></div></aside>}
      <section className="work-area" id="studio">
        <div className="work-heading"><div><div className="breadcrumb">WORKSPACE <Icon name="chevron" size={12} /> <strong>Studio</strong></div><h1>Sound <span>lab.</span></h1></div><div className="work-heading-right"><span className="mode-label"><span /> AUDIO WORKSPACE</span><button className="toolbar-button" type="button" onClick={() => setNoticeOpen(v => !v)} aria-label="Toggle workspace notes"><Icon name="more" /></button></div></div>
        {noticeOpen && <div className="notice-panel"><Icon name="activity" /><div><strong>Workspace status</strong><span>Local file playback is available. The spectrum, waveform, microphone routing and processing controls are currently illustrative and will be connected in the audio-engine stage.</span></div><button type="button" onClick={() => setNoticeOpen(false)} aria-label="Dismiss note">×</button></div>}
        <section className="module visualization-module"><div className="module-heading"><div><span className="module-index">01</span><h2>Signal monitor</h2></div><div className="segmented-control"><button type="button" className={visualMode === 'spectrum' ? 'selected' : ''} onClick={() => setVisualMode('spectrum')}>Spectrum</button><button type="button" className={visualMode === 'waveform' ? 'selected' : ''} onClick={() => setVisualMode('waveform')}>Waveform</button></div></div><div className="signal-canvas"><div className="signal-toolbar"><div><span className="live-dot" /> {visualMode === 'spectrum' ? 'FREQUENCY RESPONSE' : 'AMPLITUDE OVER TIME'}</div><span>{visualMode === 'spectrum' ? '20 Hz — 20 kHz' : 'DEMO WAVEFORM'}</span></div><div className={'signal-graph ' + visualMode}><div className="graph-labels">{(visualMode === 'spectrum' ? ['0 dB','-12 dB','-24 dB','-36 dB','-48 dB'] : ['+1.0','+0.5','0.0','-0.5','-1.0']).map(label => <span key={label}>{label}</span>)}</div><div className="graph-lines">{[0,1,2,3,4].map(line => <span key={line} />)}</div>{visualMode === 'spectrum' ? <div className="spectrum-bars">{demoSpectrum.map((height,i) => <span key={i} className={i < 22 ? 'low' : i < 49 ? 'mid' : 'high'} style={{height:height+'%'}} />)}</div> : <svg className="waveform-demo" viewBox="0 0 1000 180" preserveAspectRatio="none" aria-label="Illustrative waveform"><defs><linearGradient id="waveFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b5f36b" stopOpacity=".38" /><stop offset="100%" stopColor="#b5f36b" stopOpacity=".02" /></linearGradient></defs><path d={'M0 90 '+Array.from({length:250},(_,i)=>{const x=(i+1)*4;const y=90+Math.sin(i*.22)*Math.sin(i*.071)*(12+Math.abs(Math.sin(i*.033))*62);return 'L'+x+' '+y}).join(' ')+' L1000 90 Z'} fill="url(#waveFill)" /><path d={'M0 90 '+Array.from({length:250},(_,i)=>{const x=(i+1)*4;const y=90+Math.sin(i*.22)*Math.sin(i*.071)*(12+Math.abs(Math.sin(i*.033))*62);return 'L'+x+' '+y}).join(' ')} fill="none" stroke="#b5f36b" strokeWidth="1.6" /></svg>}<div className="frequency-labels">{(visualMode === 'spectrum' ? ['20 Hz','60 Hz','250 Hz','1 kHz','5 kHz','20 kHz'] : ['00:00','00:15','00:30','00:45','01:00','01:15']).map(label => <span key={label}>{label}</span>)}</div></div><div className="signal-footer"><div className="legend"><span className="legend-low" />LOW <span className="legend-mid" />MID <span className="legend-high" />HIGH</div><span className="demo-label">ILLUSTRATIVE DATA · LIVE ANALYSIS NEXT</span></div></div></section>
        <section className="module decks-module"><div className="module-heading"><div><span className="module-index">02</span><h2>Audio players</h2><span className="module-subtitle">Local playback · two tracks</span></div><span className="module-tag"><Icon name="headphones" size={13} /> MONITOR</span></div><div className="decks-grid"><Deck deck="A" accent="lime" /><Deck deck="B" accent="violet" /></div></section>
        <section className="module mixer-module"><div className="module-heading"><div><span className="module-index">03</span><h2>Mixer</h2><span className="module-subtitle">Control surface</span></div><span className="module-tag">PROCESSING NOT CONNECTED</span></div><div className="mixer-rack">
          {(['A','B'] as const).map(deck => <div key={deck} className="mixer-channel"><div className="channel-heading"><span className={'channel-dot ' + (deck === 'A' ? 'lime-dot' : 'violet-dot')} />CHANNEL {deck}<small>0{deck === 'A' ? '1' : '2'}</small></div><div className="eq-controls">{['LOW','MID','HIGH'].map(label => <label key={label}><span>{label}</span><input type="range" min="-12" max="12" defaultValue="0" aria-label={'Channel '+deck+' '+label+' EQ preview'} /><small>0 dB</small></label>)}</div><div className="gain-row"><span>GAIN</span><div className="gain-track"><span style={{width:'68%'}} /></div><span>0.0</span></div></div>).reduce<ReactNode[]>((acc, item, i) => { if (i === 1) acc.push(<div className="mixer-separator" key="separator"><span>↔</span></div>); acc.push(item); return acc }, [])}
          <div className="master-rack"><div className="master-label"><Icon name="volume" size={14} /> MASTER</div><strong>{master}<small>%</small></strong><input className="master-slider" type="range" min="0" max="100" value={master} onChange={e => setMaster(Number(e.target.value))} aria-label="Master level preview" /><div className="master-meter"><span style={{height:master+'%'}} /><span style={{height:Math.max(6,master-12)+'%'}} /></div></div>
          <div className="crossfader-rack"><div><span>CROSSFADER</span><small><b>A</b> — CENTER — <b>B</b></small></div><input type="range" min="0" max="100" value={crossfade} onChange={e => setCrossfade(Number(e.target.value))} aria-label="Crossfader preview" /><div className="crossfader-labels"><span>A</span><span>CENTER</span><span>B</span></div></div>
        </div></section>
        <footer className="studio-footer"><span>SOUND VISUALIZER <b>·</b> WORKSPACE FOUNDATION</span><span>MADE FOR EXPLORING SOUND <Icon name="audio" size={12} /></span></footer>
      </section>
    </div>
  </main>
}
export default App
