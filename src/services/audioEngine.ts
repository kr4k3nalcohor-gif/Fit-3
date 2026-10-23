import { SoundType } from '../types/metronome';

type BeatCallback = (beatNumber: number, time: number) => void;

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private isRunning: boolean = false;
  private bpm: number = 120;
  private beatsPerMeasure: number = 4;
  private currentBeatInMeasure: number = 0;
  private nextNoteTime: number = 0.0;
  private timerID: number | null = null;
  private lookaheadMs: number = 25.0; // how often to check scheduling
  private scheduleAheadSec: number = 0.1; // how far ahead to schedule
  private onBeatCallback: BeatCallback | null = null;
  private soundType: SoundType = 'woodblock';
  private volume: number = 0.8;
  private soundEnabled: boolean = true;
  private silentOsc: OscillatorNode | null = null;
  private silentGain: GainNode | null = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setParams(bpm: number, beatsPerMeasure: number, sound: SoundType, volume: number, soundEnabled: boolean) {
    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
    this.soundType = sound;
    this.volume = volume;
    this.soundEnabled = soundEnabled;
  }

  public setBeatCallback(cb: BeatCallback) {
    this.onBeatCallback = cb;
  }

  public start(bpm: number, beatsPerMeasure: number, sound: SoundType, volume: number, soundEnabled: boolean) {
    this.initContext();
    if (!this.audioCtx) return;

    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
    this.soundType = sound;
    this.volume = volume;
    this.soundEnabled = soundEnabled;

    if (this.isRunning) return;
    this.isRunning = true;
    this.currentBeatInMeasure = 0;
    this.nextNoteTime = this.audioCtx.currentTime + 0.05;

    // Start background keepalive audio to prevent Android sleep during workouts
    this.startKeepAlive();

    this.scheduler();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
    this.stopKeepAlive();
  }

  private startKeepAlive() {
    if (!this.audioCtx) return;
    try {
      this.silentGain = this.audioCtx.createGain();
      this.silentGain.gain.value = 0.0001; // virtually inaudible
      this.silentOsc = this.audioCtx.createOscillator();
      this.silentOsc.frequency.value = 40;
      this.silentOsc.connect(this.silentGain);
      this.silentGain.connect(this.audioCtx.destination);
      this.silentOsc.start();
    } catch {
      // Ignore keepalive error if audio context not ready
    }
  }

  private stopKeepAlive() {
    if (this.silentOsc) {
      try {
        this.silentOsc.stop();
        this.silentOsc.disconnect();
      } catch {}
      this.silentOsc = null;
    }
    if (this.silentGain) {
      try {
        this.silentGain.disconnect();
      } catch {}
      this.silentGain = null;
    }
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeatInMeasure = (this.currentBeatInMeasure + 1) % this.beatsPerMeasure;
  }

  private scheduleNote(beatNumber: number, time: number) {
    // Notify UI / Haptics at scheduled time
    const timeUntilNote = Math.max(0, (time - (this.audioCtx?.currentTime || 0)) * 1000);
    setTimeout(() => {
      if (this.isRunning && this.onBeatCallback) {
        this.onBeatCallback(beatNumber, time);
      }
    }, timeUntilNote);

    if (!this.soundEnabled || this.soundType === 'silent' || !this.audioCtx) {
      return;
    }

    const isAccent = beatNumber === 0;
    const ctx = this.audioCtx;

    switch (this.soundType) {
      case 'woodblock':
        this.playWoodblock(ctx, time, isAccent);
        break;
      case 'digital':
        this.playDigitalClick(ctx, time, isAccent);
        break;
      case 'beep':
        this.playBeep(ctx, time, isAccent);
        break;
      case 'hiit-kick':
        this.playHiitKick(ctx, time, isAccent);
        break;
    }
  }

  private playWoodblock(ctx: AudioContext, time: number, isAccent: boolean) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(isAccent ? 1200 : 800, time);
    bandpass.Q.setValueAtTime(3.0, time);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 980 : 720, time);
    osc.frequency.exponentialRampToValueAtTime(isAccent ? 480 : 340, time + 0.04);

    const baseGain = (isAccent ? 1.0 : 0.6) * this.volume;
    gain.gain.setValueAtTime(baseGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  private playDigitalClick(ctx: AudioContext, time: number, isAccent: boolean) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isAccent ? 2400 : 1600, time);

    const baseGain = (isAccent ? 0.9 : 0.5) * this.volume;
    gain.gain.setValueAtTime(baseGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.035);
  }

  private playBeep(ctx: AudioContext, time: number, isAccent: boolean) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1760 : 880, time); // A6 or A5

    const baseGain = (isAccent ? 0.8 : 0.45) * this.volume;
    gain.gain.setValueAtTime(baseGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  private playHiitKick(ctx: AudioContext, time: number, isAccent: boolean) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 180 : 130, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.09);

    const baseGain = (isAccent ? 1.0 : 0.65) * this.volume;
    gain.gain.setValueAtTime(baseGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  private scheduler = () => {
    if (!this.isRunning || !this.audioCtx) return;

    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadSec) {
      this.scheduleNote(this.currentBeatInMeasure, this.nextNoteTime);
      this.nextNote();
    }

    this.timerID = window.setTimeout(this.scheduler, this.lookaheadMs);
  };
}

export const audioEngine = new AudioEngine();
