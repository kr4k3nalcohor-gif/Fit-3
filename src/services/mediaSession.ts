interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
}

class MediaSessionManager {
  private handlers: MediaSessionHandlers | null = null;

  public setup(handlers: MediaSessionHandlers) {
    this.handlers = handlers;

    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        this.handlers?.onPlay();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.handlers?.onPause();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.handlers?.onNextTrack();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.handlers?.onPreviousTrack();
      });
    } catch {
      // Browser might ignore some action handlers
    }
  }

  public update(bpm: number, beats: number, currentBeat: number, isPlaying: boolean) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `⚡ ${bpm} BPM • Compás ${beats}/4`,
        artist: 'PulseFit Metrónomo Deportivo',
        album: isPlaying ? `Ritmo Activo: Pulso ${currentBeat + 1}/${beats}` : 'Metrónomo en Pausa',
        artwork: [
          { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      // Ignore if metadata update fails
    }
  }
}

export const mediaSessionManager = new MediaSessionManager();
