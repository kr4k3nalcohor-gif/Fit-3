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
    } catch {
      // Browser might ignore some action handlers
    }
  }

  public updateHandlers(handlers: MediaSessionHandlers) {
    this.handlers = handlers;
  }

  public update(bpm: number, beats: number, currentBeat: number, isPlaying: boolean) {
    if (!('mediaSession' in navigator)) return;

    // Only regenerate dynamic image URL when bpm or play state changes to avoid excessive canvas draws
    if (bpm !== this.lastBpm || isPlaying !== this.lastPlaying || !this.lastCaratulaUrl) {
      this.lastBpm = bpm;
      this.lastPlaying = isPlaying;
      try {
        this.lastCaratulaUrl = generateCaratulaDataUrl(bpm, beats, currentBeat, isPlaying);
      } catch {
        this.lastCaratulaUrl = '/caratula-fit3.svg';
      }
    }

    try {
      // Title and Artist formatted specifically for Samsung Galaxy Fit 3 Media Controller tile:
      // Line 1: Track Title ("PulseFit: En Ritmo")
      // Line 2: Artist ("BPM: 100") -> exactly matches Samsung One UI Media Controller display!
      navigator.mediaSession.metadata = new MediaMetadata({
        title: isPlaying ? `PulseFit: En Ritmo` : `PulseFit: Pausado`,
        artist: `BPM: ${bpm}`,
        album: `Compás ${beats}/4 • Pulso ${currentBeat + 1}`,
        artwork: [
          { src: this.lastCaratulaUrl, sizes: '512x512', type: 'image/png' },
          { src: '/caratula-fit3.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      // Ignore if metadata update fails
    }
  }
}

export const mediaSessionManager = new MediaSessionManager();
