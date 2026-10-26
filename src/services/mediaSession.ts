import { generateCaratulaDataUrl } from '../utils/caratulaGenerator';

export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
}

class MediaSessionManager {
  private handlers: MediaSessionHandlers | null = null;
  private isInitialized: boolean = false;
  private lastCaratulaUrl: string = '/caratula-fit3.svg';
  private lastBpm: number = 0;
  private lastPlaying: boolean = false;

  public setup(handlers: MediaSessionHandlers) {
    this.handlers = handlers;

    if (!('mediaSession' in navigator)) return;

    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        this.handlers?.onPlay();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.handlers?.onPause();
      });

      // Next button on Galaxy Fit 3 Media Controller -> +5 BPM
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.handlers?.onNextTrack();
      });

      // Previous button on Galaxy Fit 3 Media Controller -> -5 BPM
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.handlers?.onPreviousTrack();
      });

      // Seek actions (often sent by watch long-press or certain One UI firmware builds)
      navigator.mediaSession.setActionHandler('seekforward', () => {
        this.handlers?.onNextTrack();
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        this.handlers?.onPreviousTrack();
      });
    } catch (handlerError: unknown) {
      console.debug('MediaSession action handler registration note:', handlerError);
    }
  }

  public updateHandlers(handlers: MediaSessionHandlers) {
    this.handlers = handlers;
  }

  private lastBeats: number = 0;

  public update(bpm: number, beats: number, currentBeat: number, isPlaying: boolean) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const hasStateChanged = bpm !== this.lastBpm || isPlaying !== this.lastPlaying || beats !== this.lastBeats || !this.lastCaratulaUrl;

    if (hasStateChanged) {
      this.lastBpm = bpm;
      this.lastPlaying = isPlaying;
      this.lastBeats = beats;

      try {
        this.lastCaratulaUrl = generateCaratulaDataUrl(bpm, beats, currentBeat, isPlaying);
      } catch (canvasError: unknown) {
        console.warn('Caratula generation failed, falling back to static SVG:', canvasError);
        this.lastCaratulaUrl = '/caratula-fit3.svg';
      }

      try {
        if (typeof MediaMetadata !== 'undefined') {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: isPlaying ? `PulseFit: En Ritmo` : `PulseFit: Pausado`,
            artist: `BPM: ${bpm}`,
            album: `Compás ${beats}/4 • Pulso ${currentBeat + 1}`,
            artwork: [
              { src: this.lastCaratulaUrl, sizes: '512x512', type: 'image/png' },
              { src: '/caratula-fit3.svg', sizes: '512x512', type: 'image/svg+xml' }
            ]
          });
        }
      } catch (metadataError: unknown) {
        console.debug('MediaSession metadata update ignored by platform:', metadataError);
      }
    }

    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (playbackError: unknown) {
      console.debug('MediaSession playbackState update ignored:', playbackError);
    }
  }
}

export const mediaSessionManager = new MediaSessionManager();
