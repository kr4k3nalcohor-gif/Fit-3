package com.pulsefit.metronome

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class MetronomeService : Service() {

    private val CHANNEL_ID = "pulsefit_running_channel"
    private val NOTIF_ID = 1001

    private var mediaSession: MediaSessionCompat? = null
    private var job: Job? = null
    private val scope = CoroutineScope(Dispatchers.Default)

    private var vibrator: Vibrator? = null
    private var isPlaying = false
    private var bpm = 160
    private var beatsPerMeasure = 4
    private var currentBeat = 0
    private var vibrationMs = 85L // Running standard
    private var accentFirstBeat = true

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val ACTION_SET_BPM = "ACTION_SET_BPM"
        const val ACTION_SET_BEATS = "ACTION_SET_BEATS"
        const val ACTION_SET_VIBRATION = "ACTION_SET_VIBRATION"

        const val EXTRA_BPM = "EXTRA_BPM"
        const val EXTRA_BEATS = "EXTRA_BEATS"
        const val EXTRA_VIBRATION_MS = "EXTRA_VIBRATION_MS"
    }

    override fun onCreate() {
        super.onCreate()
        initVibrator()
        initMediaSession()
        createNotificationChannel()
    }

    private fun initVibrator() {
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    private fun initMediaSession() {
        mediaSession = MediaSessionCompat(this, "PulseFitMediaSession").apply {
            setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS)

            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    startMetronome()
                }

                override fun onPause() {
                    stopMetronome()
                }

                override fun onSkipToNext() {
                    // Samsung Galaxy Fit 3 Next Track button -> +5 BPM
                    setBpm(bpm + 5)
                }

                override fun onSkipToPrevious() {
                    // Samsung Galaxy Fit 3 Previous Track button -> -5 BPM
                    setBpm(bpm - 5)
                }
            })

            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                bpm = intent.getIntExtra(EXTRA_BPM, bpm)
                beatsPerMeasure = intent.getIntExtra(EXTRA_BEATS, beatsPerMeasure)
                vibrationMs = intent.getLongExtra(EXTRA_VIBRATION_MS, vibrationMs)
                startMetronome()
            }
            ACTION_STOP -> stopMetronome()
            ACTION_SET_BPM -> {
                val newBpm = intent.getIntExtra(EXTRA_BPM, bpm)
                setBpm(newBpm)
            }
        }
        return START_STICKY
    }

    private fun startMetronome() {
        if (isPlaying) return
        isPlaying = true
        currentBeat = 0
        updateNotification()
        updateMediaSession()

        startForeground(NOTIF_ID, buildNotification())

        job = scope.launch {
            while (isActive && isPlaying) {
                val intervalMs = (60_000.0 / bpm).toLong()
                triggerHaptic(currentBeat)
                currentBeat = (currentBeat + 1) % beatsPerMeasure
                updateMediaSession()
                delay(intervalMs)
            }
        }
    }

    private fun stopMetronome() {
        isPlaying = false
        job?.cancel()
        job = null
        updateMediaSession()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun setBpm(newBpm: Int) {
        bpm = newBpm.coerceIn(30, 260)
        updateMediaSession()
        updateNotification()
    }

    private fun triggerHaptic(beat: Int) {
        val isFirst = beat == 0 && accentFirstBeat
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (isFirst) {
                // Double burst for accent
                val timings = longArrayOf(0, (vibrationMs * 1.3).toLong(), 35, (vibrationMs * 0.9).toLong())
                val amplitudes = intArrayOf(0, 255, 0, 200)
                vibrator?.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
            } else {
                vibrator?.vibrate(VibrationEffect.createOneShot(vibrationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            }
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(if (isFirst) vibrationMs * 2 else vibrationMs)
        }
    }

    private fun updateMediaSession() {
        val state = if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
        mediaSession?.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setActions(
                    PlaybackStateCompat.ACTION_PLAY or
                    PlaybackStateCompat.ACTION_PAUSE or
                    PlaybackStateCompat.ACTION_PLAY_PAUSE or
                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                    PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                )
                .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .build()
        )

        mediaSession?.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, "⚡ $bpm BPM · Compás $beatsPerMeasure/4")
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, "PulseFit Metrónomo Háptico")
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, if (isPlaying) "Tiempo ${currentBeat + 1}/$beatsPerMeasure" else "Pausado")
                .build()
        )
    }

    private fun buildNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("PulseFit: $bpm BPM ($beatsPerMeasure/4)")
            .setContentText(if (isPlaying) "Pulso háptico activo · Control en Galaxy Fit 3" else "En pausa")
            .setSmallIcon(android.R.drawable.ic_lock_idle_charging)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.notify(NOTIF_ID, buildNotification())
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "PulseFit Metrónomo Servicio",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantiene el pulso háptico y sincronización con pulsera Galaxy Fit 3"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopMetronome()
        mediaSession?.release()
    }
}
