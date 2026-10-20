export type DeckId = 'A' | 'B'
export type EqBand = 'low' | 'mid' | 'high'

type DeckNodes = {
  filters: Record<EqBand, BiquadFilterNode>
  gain: GainNode
  crossfade: GainNode
}

export class AudioEngine {
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private master: GainNode | null = null
  private readonly decks = new Map<DeckId, DeckNodes>()
  private readonly sources = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>()
  private micStream: MediaStream | null = null
  private micSource: MediaStreamAudioSourceNode | null = null

  private getContext() {
    if (!this.context) {
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      const master = context.createGain()
      analyser.fftSize = 4096
      analyser.smoothingTimeConstant = 0.78
      analyser.connect(master)
      master.connect(context.destination)
      this.context = context
      this.analyser = analyser
      this.master = master
      master.gain.value = 0.78
      this.setCrossfade(50)
    }
    return this.context
  }

  getAnalyser() {
    this.getContext()
    return this.analyser
  }

  async resume() {
    const context = this.getContext()
    if (context.state !== 'running') await context.resume()
  }

  async connectDeck(deck: DeckId, audio: HTMLAudioElement) {
    const context = this.getContext()
    await this.resume()
    let nodes = this.decks.get(deck)
    if (!nodes) {
      const low = context.createBiquadFilter()
      low.type = 'lowshelf'
      low.frequency.value = 250
      const mid = context.createBiquadFilter()
      mid.type = 'peaking'
      mid.frequency.value = 1000
      mid.Q.value = 0.8
      const high = context.createBiquadFilter()
      high.type = 'highshelf'
      high.frequency.value = 4000
      const gain = context.createGain()
      const crossfade = context.createGain()
      low.connect(mid)
      mid.connect(high)
      high.connect(gain)
      gain.connect(crossfade)
      crossfade.connect(this.analyser!)
      nodes = { filters: { low, mid, high }, gain, crossfade }
      this.decks.set(deck, nodes)
    }
    let source = this.sources.get(audio)
    if (!source) {
      source = context.createMediaElementSource(audio)
      this.sources.set(audio, source)
    }
    try { source.disconnect() } catch { /* no existing connections */ }
    source.connect(nodes.filters.low)
    this.updateCrossfadeGains()
    return this.analyser!
  }

  setEQ(deck: DeckId, band: EqBand, decibels: number) {
    const filter = this.decks.get(deck)?.filters[band]
    if (filter) filter.gain.setTargetAtTime(decibels, this.context!.currentTime, 0.015)
  }

  setDeckGain(deck: DeckId, decibels: number) {
    const gain = this.decks.get(deck)?.gain
    if (gain) gain.gain.setTargetAtTime(Math.pow(10, decibels / 20), this.context!.currentTime, 0.015)
  }

  setCrossfade(value: number) {
    const position = Math.max(0, Math.min(100, value)) / 100
    const nodesA = this.decks.get('A')
    const nodesB = this.decks.get('B')
    if (nodesA) nodesA.crossfade.gain.value = Math.cos(position * Math.PI / 2)
    if (nodesB) nodesB.crossfade.gain.value = Math.sin(position * Math.PI / 2)
    this.updateCrossfadeGains()
  }

  private updateCrossfadeGains() {
    if (!this.context) return
    // Equal-power crossfade keeps perceived level more consistent through the middle.
    const nodesA = this.decks.get('A')
    const nodesB = this.decks.get('B')
    if (nodesA) nodesA.crossfade.gain.setTargetAtTime(Math.cos((this.crossfade / 100) * Math.PI / 2), this.context.currentTime, 0.015)
    if (nodesB) nodesB.crossfade.gain.setTargetAtTime(Math.sin((this.crossfade / 100) * Math.PI / 2), this.context.currentTime, 0.015)
  }

  private crossfade = 50

  setCrossfader(value: number) {
    this.crossfade = Math.max(0, Math.min(100, value))
    this.updateCrossfadeGains()
  }

  setMaster(value: number) {
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(Math.max(0, Math.min(100, value)) / 100, this.context.currentTime, 0.015)
    }
  }

  async enableMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone capture is not available in this browser.')
    if (this.micStream) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    const context = this.getContext()
    this.micStream = stream
    this.micSource = context.createMediaStreamSource(stream)
    this.micSource.connect(this.analyser!)
    await this.resume()
  }

  disableMicrophone() {
    this.micSource?.disconnect()
    this.micSource = null
    this.micStream?.getTracks().forEach(track => track.stop())
    this.micStream = null
  }

  async decodeWaveform(file: File, points = 112) {
    const context = this.getContext()
    const decoded = await context.decodeAudioData(await file.arrayBuffer())
    const channel = decoded.getChannelData(0)
    const blockSize = Math.max(1, Math.floor(channel.length / points))
    const peaks = Array.from({ length: points }, (_, index) => {
      let peak = 0
      const start = index * blockSize
      const end = Math.min(channel.length, start + blockSize)
      for (let i = start; i < end; i++) peak = Math.max(peak, Math.abs(channel[i]))
      return Math.max(3, Math.round(peak * 100))
    })
    return peaks
  }

  async close() {
    this.disableMicrophone()
    try { await this.context?.close() } catch { /* context may already be closed */ }
    this.context = null
    this.analyser = null
    this.master = null
    this.decks.clear()
  }
}
