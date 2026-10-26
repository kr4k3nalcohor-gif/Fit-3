package com.pulsefit.metronome

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
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

    private val TAG = "MetronomeService"
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
    private var vibrationMs = 85L
    private var accentFirstBeat = true
    private var vibratePhone = false // User requested: ONLY Fit 3 vibrates, NOT the phone!

    // Audio generation for phone metronome sound
    private var audioTrack: AudioTrack? = null
    private var accentPcm: ShortArray = ShortArray(0)
    private var regularPcm: ShortArray = ShortArray(0)

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val ACTION_SET_BPM = "ACTION_SET_BPM"
        const val ACTION_SET_BEATS = "ACTION_SET_BEATS"
        const val ACTION_SET_VIBRATION = "ACTION_SET_VIBRATION"
        const val ACTION_BPM_UPDATED = "com.pulsefit.metronome.BPM_UPDATED"

        const val EXTRA_BPM = "EXTRA_BPM"
        const val EXTRA_BEATS = "EXTRA_BEATS"
        const val EXTRA_VIBRATION_MS = "EXTRA_VIBRATION_MS"
        const val EXTRA_VIBRATE_PHONE = "EXTRA_VIBRATE_PHONE"

        var currentBpm = 160
        var isServiceRunning = false
    }

    override fun onCreate() {
        super.onCreate()
        initVibrator()
        initAudioEngine()
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

    private fun initAudioEngine() {
        val sampleRate = 44100
        val accentDuration = (0.040 * sampleRate).toInt()
        val regularDuration = (0.025 * sampleRate).toInt()

        accentPcm = ShortArray(accentDuration)
        for (i in 0 until accentDuration) {
            val t = i.toDouble() / sampleRate
            val decay = kotlin.math.exp(-i.toDouble() / (sampleRate * 0.007))
            val sample = (kotlin.math.sin(2.0 * Math.PI * 1200.0 * t) * decay * 32767.0 * 0.95).toInt()
            accentPcm[i] = sample.coerceIn(-32768, 32767).toShort()
        }

        regularPcm = ShortArray(regularDuration)
        for (i in 0 until regularDuration) {
            val t = i.toDouble() / sampleRate
            val decay = kotlin.math.exp(-i.toDouble() / (sampleRate * 0.006))
            val sample = (kotlin.math.sin(2.0 * Math.PI * 820.0 * t) * decay * 32767.0 * 0.85).toInt()
            regularPcm[i] = sample.coerceIn(-32768, 32767).toShort()
        }

        val bufferSize = AudioTrack.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        ).coerceAtLeast(accentDuration * 4)

        try {
            audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(bufferSize)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build()

            audioTrack?.play()
        } catch (audioInitException: Exception) {
            Log.e(TAG, "Error initializing or starting AudioTrack", audioInitException)
        }
    }

    private fun playBeatAudio(isAccent: Boolean) {
        try {
            val buffer = if (isAccent) accentPcm else regularPcm
            audioTrack?.write(buffer, 0, buffer.size)
        } catch (audioWriteException: Exception) {
            Log.w(TAG, "Error writing audio buffer to AudioTrack", audioWriteException)
        }
    }

    private fun initMediaSession() {
        mediaSession = MediaSessionCompat(this, "PulseFitMediaSession").apply {
            setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS)

            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    Log.d(TAG, "MediaSession: onPlay received from Galaxy Fit 3 or lockscreen")
                    startMetronome()
                }

                override fun onPause() {
                    Log.d(TAG, "MediaSession: onPause received from Galaxy Fit 3 or lockscreen")
                    stopMetronome()
                }

                override fun onSkipToNext() {
                    // Samsung Galaxy Fit 3 Next Track button -> +5 BPM
                    Log.d(TAG, "MediaSession: onSkipToNext received (+5 BPM)")
                    setBpm(bpm + 5)
                }

                override fun onSkipToPrevious() {
                    // Samsung Galaxy Fit 3 Previous Track button -> -5 BPM
                    Log.d(TAG, "MediaSession: onSkipToPrevious received (-5 BPM)")
                    setBpm(bpm - 5)
                }

                override fun onFastForward() {
                    Log.d(TAG, "MediaSession: onFastForward received (+5 BPM)")
                    setBpm(bpm + 5)
                }

                override fun onRewind() {
                    Log.d(TAG, "MediaSession: onRewind received (-5 BPM)")
                    setBpm(bpm - 5)
                }
            })

            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand received action: ${intent?.action}")
        when (intent?.action) {
            ACTION_START -> {
                bpm = intent.getIntExtra(EXTRA_BPM, bpm)
                currentBpm = bpm
                beatsPerMeasure = intent.getIntExtra(EXTRA_BEATS, beatsPerMeasure)
                vibrationMs = intent.getLongExtra(EXTRA_VIBRATION_MS, vibrationMs)
                vibratePhone = intent.getBooleanExtra(EXTRA_VIBRATE_PHONE, false)
                Log.i(TAG, "ACTION_START: BPM=$bpm, beats=$beatsPerMeasure, vibrationMs=$vibrationMs, vibratePhone=$vibratePhone")
                startMetronome()
            }
            ACTION_STOP -> {
                Log.i(TAG, "ACTION_STOP received")
                stopMetronome()
            }
            ACTION_SET_BPM -> {
                val newBpm = intent.getIntExtra(EXTRA_BPM, bpm)
                Log.d(TAG, "ACTION_SET_BPM received: $newBpm")
                setBpm(newBpm)
            }
        }
        return START_STICKY
    }

    private fun startMetronome() {
        if (isPlaying) {
            Log.d(TAG, "startMetronome: already running")
            return
        }
        Log.i(TAG, "startMetronome: starting playback loop at $bpm BPM ($beatsPerMeasure/4)")
        isPlaying = true
        isServiceRunning = true
        currentBeat = 0
        updateNotification()
        updateMediaSession()

        startForeground(NOTIF_ID, buildNotification())

        job = scope.launch {
            while (isActive && isPlaying) {
                val intervalMs = (60_000.0 / bpm).toLong()

                // 1. Phone generates audio click (metronome sound)
                val isAccent = currentBeat == 0
                playBeatAudio(isAccent)

                // 2. Only vibrate phone if explicitly requested (default: off)
                if (vibratePhone) {
                    triggerHaptic(currentBeat)
                }

                currentBeat = (currentBeat + 1) % beatsPerMeasure
                updateMediaSession()
                delay(intervalMs)
            }
        }
    }

    private fun stopMetronome() {
        Log.i(TAG, "stopMetronome: stopping playback loop")
        isPlaying = false
        isServiceRunning = false
        job?.cancel()
        job = null
        updateMediaSession()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun setBpm(newBpm: Int) {
        val clamped = newBpm.coerceIn(30, 260)
        Log.i(TAG, "setBpm: changing BPM from $bpm to $clamped")
        bpm = clamped
        currentBpm = bpm
        updateMediaSession()
        updateNotification()

        // Broadcast to MainActivity so phone UI number updates immediately!
        val broadcastIntent = Intent(ACTION_BPM_UPDATED).apply {
            putExtra(EXTRA_BPM, bpm)
            setPackage(packageName)
        }
        sendBroadcast(broadcastIntent)
    }

    private fun triggerHaptic(beat: Int) {
        val isFirst = beat == 0 && accentFirstBeat
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (isFirst) {
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
                    PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                    PlaybackStateCompat.ACTION_FAST_FORWARD or
                    PlaybackStateCompat.ACTION_REWIND
                )
                .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .build()
        )

        mediaSession?.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, if (isPlaying) "PulseFit: En Ritmo" else "PulseFit: Pausado")
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, "BPM: $bpm")
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Compás $beatsPerMeasure/4 • Pulso ${currentBeat + 1}")
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
            .setContentText(if (isPlaying) "Sonido activo · Control desde Galaxy Fit 3" else "En pausa")
            .setSmallIcon(android.R.drawable.ic_lock_idle_charging)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "PulseFit Metrónomo Servicio",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Sonido de metrónomo y sincronización con pulsera Galaxy Fit 3"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopMetronome()
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (audioReleaseException: Exception) {
            Log.w(TAG, "Error releasing AudioTrack resources", audioReleaseException)
        }
        audioTrack = null
        mediaSession?.release()
    }
}
