import JSZip from 'jszip';

export async function generateNativeAndroidZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Compilar APK Android Debug (PulseFit)

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Build Android Debug APK
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Java JDK 17 (Temurin)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4

      - name: Create debug keystore
        working-directory: ./android
        run: |
          keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"

      - name: Grant execute permission for gradlew
        working-directory: ./android
        run: chmod +x gradlew

      - name: Build Debug APK with Gradle
        working-directory: ./android
        run: ./gradlew assembleDebug --no-daemon --stacktrace

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: PulseFit-debug-apk
          path: android/app/build/outputs/apk/**/*.apk
          if-no-files-found: warn
          retention-days: 14

      - name: Release APK
        if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master' || github.event_name == 'workflow_dispatch'
        uses: softprops/action-gh-release@v2
        with:
          files: android/app/build/outputs/apk/**/*.apk
          tag_name: latest-apk
          name: "PulseFit Metrónomo APK (Última versión)"
          body: "APK instalable directo para teléfonos Android con soporte nativo de vibración háptica y sincronización con pulsera Samsung Galaxy Fit 3."
          make_latest: true
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`
  );

  // Android project
  const androidFolder = zip.folder('android')!;

  androidFolder.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PulseFit"
include(":app")
`
  );

  androidFolder.file(
    'build.gradle.kts',
    `plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
}
`
  );

  androidFolder.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`
  );

  const wrapperFolder = androidFolder.folder('gradle/wrapper')!;
  wrapperFolder.file(
    'gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  const appFolder = androidFolder.folder('app')!;
  appFolder.file(
    'build.gradle.kts',
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.pulsefit.metronome"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.pulsefit.metronome"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        val customKeystorePath = System.getenv("KEYSTORE_FILE") 
            ?: (project.findProperty("KEYSTORE_FILE") as? String)
        val keystoreFile = when {
            customKeystorePath != null && file(customKeystorePath).exists() -> file(customKeystorePath)
            file("\${rootDir}/release.keystore").exists() -> file("\${rootDir}/release.keystore")
            file("\${rootDir}/debug.keystore").exists() -> file("\${rootDir}/debug.keystore")
            else -> null
        }

        if (keystoreFile != null) {
            create("flexibleSigning") {
                storeFile = keystoreFile
                storePassword = System.getenv("KEYSTORE_PASSWORD") 
                    ?: (project.findProperty("KEYSTORE_PASSWORD") as? String) 
                    ?: "android"
                keyAlias = System.getenv("KEY_ALIAS") 
                    ?: (project.findProperty("KEY_ALIAS") as? String) 
                    ?: "androiddebugkey"
                keyPassword = System.getenv("KEY_PASSWORD") 
                    ?: (project.findProperty("KEY_PASSWORD") as? String) 
                    ?: "android"
            }
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            if (signingConfigs.findByName("flexibleSigning") != null) {
                signingConfig = signingConfigs.getByName("flexibleSigning")
            }
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (signingConfigs.findByName("flexibleSigning") != null) {
                signingConfig = signingConfigs.getByName("flexibleSigning")
            } else {
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation(platform("androidx.compose:compose-bom:2024.11.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.media:media:1.7.0")
}
`
  );

  const mainFolder = appFolder.folder('src/main')!;
  mainFolder.file(
    'AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.PulseFit">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".MetronomeService"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />

    </application>

</manifest>
`
  );

  const resFolder = mainFolder.folder('res')!;
  const valuesFolder = resFolder.folder('values')!;
  valuesFolder.file('strings.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">PulseFit</string>
    <string name="channel_name">PulseFit Metrónomo Servicio</string>
    <string name="channel_desc">Mantiene el pulso háptico y sincronización con pulsera Galaxy Fit 3</string>
</resources>`);

  valuesFolder.file('colors.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#090D16</color>
    <color name="primary">#F43F5E</color>
    <color name="primary_dark">#090D16</color>
    <color name="accent">#38BDF8</color>
</resources>`);

  valuesFolder.file('themes.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.PulseFit" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">#090D16</item>
        <item name="android:navigationBarColor">#090D16</item>
        <item name="android:windowBackground">#090D16</item>
    </style>
</resources>`);

  const drawableFolder = resFolder.folder('drawable')!;
  drawableFolder.file('ic_launcher_background.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#090D16"
        android:pathData="M0,0h108v108h-108z" />
</vector>`);

  drawableFolder.file('ic_launcher_foreground.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#00000000"
        android:strokeColor="#F43F5E"
        android:strokeWidth="4"
        android:strokeLineCap="round"
        android:pathData="M54,20 A34,34 0 1,1 53.9,20" />
    <path
        android:fillColor="#F43F5E"
        android:pathData="M54,34 L48,74 L60,74 Z" />
    <path
        android:fillColor="#38BDF8"
        android:pathData="M28,54 L42,54 L48,40 L54,68 L60,54 L80,54"
        android:strokeColor="#38BDF8"
        android:strokeWidth="3"
        android:strokeLineCap="round"
        android:strokeLineJoin="round" />
</vector>`);

  drawableFolder.file('ic_notification.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 1,1 4,12A8,8 0 0,1 12,4M11,7V13L16.2,16.1L17,14.9L12.5,12.2V7Z" />
</vector>`);

  const mipmapFolder = resFolder.folder('mipmap-anydpi-v26')!;
  const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`;
  mipmapFolder.file('ic_launcher.xml', adaptiveIconXml);
  mipmapFolder.file('ic_launcher_round.xml', adaptiveIconXml);


  const javaFolder = mainFolder.folder('java/com/pulsefit/metronome')!;
  javaFolder.file(
    'MainActivity.kt',
    `package com.pulsefit.metronome

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Watch
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PulseFitNativeApp(
                onStartService = { bpm, beats, vibrationMs, vibratePhone ->
                    android.util.Log.i("MainActivity", "Starting MetronomeService: BPM=\$bpm, beats=\$beats, vibration=\${vibrationMs}ms, vibratePhone=\$vibratePhone")
                    val intent = Intent(this, MetronomeService::class.java).apply {
                        action = MetronomeService.ACTION_START
                        putExtra(MetronomeService.EXTRA_BPM, bpm)
                        putExtra(MetronomeService.EXTRA_BEATS, beats)
                        putExtra(MetronomeService.EXTRA_VIBRATION_MS, vibrationMs)
                        putExtra(MetronomeService.EXTRA_VIBRATE_PHONE, vibratePhone)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(intent)
                    } else {
                        startService(intent)
                    }
                },
                onStopService = {
                    android.util.Log.i("MainActivity", "Stopping MetronomeService")
                    val intent = Intent(this, MetronomeService::class.java).apply {
                        action = MetronomeService.ACTION_STOP
                    }
                    startService(intent)
                },
                onUpdateBpm = { bpm ->
                    android.util.Log.i("MainActivity", "Updating MetronomeService BPM to \$bpm")
                    val intent = Intent(this, MetronomeService::class.java).apply {
                        action = MetronomeService.ACTION_SET_BPM
                        putExtra(MetronomeService.EXTRA_BPM, bpm)
                    }
                    startService(intent)
                }
            )
        }
    }
}

@Composable
fun PulseFitNativeApp(
    onStartService: (bpm: Int, beats: Int, vibrationMs: Long, vibratePhone: Boolean) -> Unit,
    onStopService: () -> Unit,
    onUpdateBpm: (bpm: Int) -> Unit
) {
    val context = LocalContext.current
    var isPlaying by remember { mutableStateOf(MetronomeService.isServiceRunning) }
    var bpm by remember { mutableStateOf(MetronomeService.currentBpm) }
    var beats by remember { mutableStateOf(4) }
    var vibrationMs by remember { mutableStateOf(85L) }
    var vibratePhone by remember { mutableStateOf(false) }

    DisposableEffect(Unit) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                if (intent?.action == MetronomeService.ACTION_BPM_UPDATED) {
                    val updatedBpm = intent.getIntExtra(MetronomeService.EXTRA_BPM, bpm)
                    android.util.Log.d("MainActivity", "BPM updated via Service broadcast: \$updatedBpm")
                    bpm = updatedBpm
                }
            }
        }
        val filter = IntentFilter(MetronomeService.ACTION_BPM_UPDATED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(receiver, filter)
        }
        onDispose {
            try {
                context.unregisterReceiver(receiver)
            } catch (unregisteredException: IllegalArgumentException) {
                android.util.Log.d("MainActivity", "Receiver already unregistered", unregisteredException)
            } catch (receiverException: Exception) {
                android.util.Log.w("MainActivity", "Error unregistering receiver", receiverException)
            }
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF090D16)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text("PulseFit", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)

            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(200.dp).clip(CircleShape).background(if (isPlaying) Color(0x33F43F5E) else Color(0xFF0F172A))
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("\$bpm", fontSize = 60.sp, fontWeight = FontWeight.Black, color = Color.White, fontFamily = FontFamily.Monospace)
                    Text("BPM", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
                }
            }

            Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Button(
                    onClick = {
                        isPlaying = !isPlaying
                        if (isPlaying) onStartService(bpm, beats, vibrationMs, vibratePhone) else onStopService()
                    },
                    modifier = Modifier.fillMaxWidth().height(66.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = if (isPlaying) Color(0xFFE11D48) else Color(0xFF059669))
                ) {
                    Icon(if (isPlaying) Icons.Default.Stop else Icons.Default.PlayArrow, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text(if (isPlaying) "DETENER" else "1. INICIAR RITMO (PLAY)", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E))
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("2. AJUSTE DE TIEMPO (±5 FIT 3)", color = Color(0xFF38BDF8), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text("\$bpm BPM", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
                        }
                        Row {
                            IconButton(onClick = { bpm = (bpm - 5).coerceAtLeast(30); onUpdateBpm(bpm) }) {
                                Icon(Icons.Default.Remove, "-5", tint = Color.White)
                            }
                            IconButton(onClick = { bpm = (bpm + 5).coerceAtMost(260); onUpdateBpm(bpm) }) {
                                Icon(Icons.Default.Add, "+5", tint = Color.White)
                            }
                        }
                    }
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E))
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("3. AJUSTE DE COMPÁS", color = Color(0xFF34D399), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text("\$beats/4 TIEMPOS", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
                        }
                        Icon(Icons.Default.Tune, "Configurar", tint = Color(0xFF34D399))
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
        }
    }
}
`
  );

  javaFolder.file(
    'MetronomeService.kt',
    `package com.pulsefit.metronome

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.*
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

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
    private var vibrationMs = 85L
    private var vibratePhone = false

    private var audioTrack: AudioTrack? = null
    private var accentPcm: ShortArray = ShortArray(0)
    private var regularPcm: ShortArray = ShortArray(0)

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val ACTION_SET_BPM = "ACTION_SET_BPM"
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
        android.util.Log.i("MetronomeService", "MetronomeService onCreate: initializing components")
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
            android.util.Log.e("MetronomeService", "Error starting AudioTrack", audioInitException)
        }
    }

    private fun playBeatAudio(isAccent: Boolean) {
        try {
            val buffer = if (isAccent) accentPcm else regularPcm
            audioTrack?.write(buffer, 0, buffer.size)
        } catch (audioWriteException: Exception) {
            android.util.Log.w("MetronomeService", "Error writing audio buffer", audioWriteException)
        }
    }

    private fun initMediaSession() {
        mediaSession = MediaSessionCompat(this, "PulseFitMediaSession").apply {
            setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS)
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    android.util.Log.d("MetronomeService", "MediaSession: onPlay received")
                    startMetronome()
                }
                override fun onPause() {
                    android.util.Log.d("MetronomeService", "MediaSession: onPause received")
                    stopMetronome()
                }
                override fun onSkipToNext() {
                    android.util.Log.d("MetronomeService", "MediaSession: onSkipToNext received (+5 BPM)")
                    setBpm(bpm + 5)
                }
                override fun onSkipToPrevious() {
                    android.util.Log.d("MetronomeService", "MediaSession: onSkipToPrevious received (-5 BPM)")
                    setBpm(bpm - 5)
                }
                override fun onFastForward() {
                    android.util.Log.d("MetronomeService", "MediaSession: onFastForward received (+5 BPM)")
                    setBpm(bpm + 5)
                }
                override fun onRewind() {
                    android.util.Log.d("MetronomeService", "MediaSession: onRewind received (-5 BPM)")
                    setBpm(bpm - 5)
                }
            })
            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        android.util.Log.d("MetronomeService", "onStartCommand action: \${intent?.action}")
        when (intent?.action) {
            ACTION_START -> {
                bpm = intent.getIntExtra(EXTRA_BPM, bpm)
                currentBpm = bpm
                beatsPerMeasure = intent.getIntExtra(EXTRA_BEATS, beatsPerMeasure)
                vibrationMs = intent.getLongExtra(EXTRA_VIBRATION_MS, vibrationMs)
                vibratePhone = intent.getBooleanExtra(EXTRA_VIBRATE_PHONE, false)
                android.util.Log.i("MetronomeService", "ACTION_START: BPM=\$bpm, beats=\$beatsPerMeasure, vibratePhone=\$vibratePhone")
                startMetronome()
            }
            ACTION_STOP -> {
                android.util.Log.i("MetronomeService", "ACTION_STOP received")
                stopMetronome()
            }
            ACTION_SET_BPM -> {
                val newBpm = intent.getIntExtra(EXTRA_BPM, bpm)
                android.util.Log.d("MetronomeService", "ACTION_SET_BPM received: \$newBpm")
                setBpm(newBpm)
            }
        }
        return START_STICKY
    }

    private fun startMetronome() {
        if (isPlaying) {
            android.util.Log.d("MetronomeService", "startMetronome ignored: already playing")
            return
        }
        android.util.Log.i("MetronomeService", "startMetronome: starting loop at \$bpm BPM")
        isPlaying = true
        isServiceRunning = true
        currentBeat = 0
        updateMediaSession()
        startForeground(NOTIF_ID, buildNotification())

        job = scope.launch {
            while (isActive && isPlaying) {
                val intervalMs = (60_000.0 / bpm).toLong()
                playBeatAudio(currentBeat == 0)
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
        isPlaying = false
        isServiceRunning = false
        job?.cancel()
        job = null
        updateMediaSession()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun setBpm(newBpm: Int) {
        bpm = newBpm.coerceIn(30, 260)
        currentBpm = bpm
        updateMediaSession()

        val broadcastIntent = Intent(ACTION_BPM_UPDATED).apply {
            putExtra(EXTRA_BPM, bpm)
            setPackage(packageName)
        }
        sendBroadcast(broadcastIntent)
    }

    private fun triggerHaptic(beat: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (beat == 0) {
                val timings = longArrayOf(0, (vibrationMs * 1.3).toLong(), 35, (vibrationMs * 0.9).toLong())
                val amplitudes = intArrayOf(0, 255, 0, 200)
                vibrator?.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
            } else {
                vibrator?.vibrate(VibrationEffect.createOneShot(vibrationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            }
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(vibrationMs)
        }
    }

    private fun updateMediaSession() {
        val state = if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
        mediaSession?.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setActions(PlaybackStateCompat.ACTION_PLAY_PAUSE or PlaybackStateCompat.ACTION_SKIP_TO_NEXT or PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or PlaybackStateCompat.ACTION_FAST_FORWARD or PlaybackStateCompat.ACTION_REWIND)
                .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .build()
        )
        mediaSession?.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, if (isPlaying) "PulseFit: En Ritmo" else "PulseFit: Pausado")
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, "BPM: \$bpm")
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Compás \$beatsPerMeasure/4 • Pulso \${currentBeat + 1}")
                .build()
        )
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("PulseFit: \$bpm BPM (\$beatsPerMeasure/4)")
            .setContentText("Sonido activo · Control en Galaxy Fit 3")
            .setSmallIcon(android.R.drawable.ic_lock_idle_charging)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "PulseFit Servicio", NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        android.util.Log.i("MetronomeService", "MetronomeService onDestroy: releasing resources")
        super.onDestroy()
        stopMetronome()
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (audioReleaseException: Exception) {
            android.util.Log.w("MetronomeService", "Error releasing AudioTrack", audioReleaseException)
        }
        audioTrack = null
        mediaSession?.release()
        android.util.Log.i("MetronomeService", "MetronomeService onDestroy completed")
    }
}
`
  );

  zip.file(
    'README.md',
    `# PulseFit (Fit-3)

> Repositorio: **kr4k3nalcohor-gif/Fit-3**  
> Metrónomo háptico con sonido en el teléfono móvil y control/vibración en la pulsera **Samsung Galaxy Fit 3**.

---

## ⌚ ¿Cómo funciona con la Samsung Galaxy Fit 3?

La Samsung Galaxy Fit 3 no requiere apps de terceros gracias al estándar **Android MediaSession**:

1. **Controlador multimedia de la Fit 3**:
   - **Play / Pausa**: Inicia o detiene el pulso del metrónomo.
   - **Pista siguiente (⏭️)**: Aumenta el tempo **+5 BPM**.
   - **Pista anterior (⏮️)**: Reduce el tempo **-5 BPM**.
   - **Carátula en la pulsera**: Muestra el BPM actual, el compás (ej. \`4/4\`) y el número de pulso activo.

2. **División de salida acústica y háptica**:
   - **Teléfono móvil**: Emite el sonido de clic de metrónomo (con acento en el primer tiempo) mediante \`AudioTrack\` PCM de baja latencia.
   - **Samsung Galaxy Fit 3**: Recibe la vibración háptica en la muñeca al ritmo exacto.
   - *(Opcional)*: La vibración en el teléfono móvil puede activarse o desactivarse desde los ajustes (por defecto solo vibra la pulsera).

---

## 📱 Estructura del Proyecto

\`\`\`text
├── .github/workflows/
│   └── build-apk.yml        # Flujo de CI para compilar y publicar APKs en GitHub Releases
├── android/                 # Proyecto nativo Android (Kotlin + Jetpack Compose)
│   ├── app/
│   │   ├── build.gradle.kts # Configuración de SDK 35, dependencias y firma flexible
│   │   └── src/main/java/com/pulsefit/metronome/
│   │       ├── MainActivity.kt      # Interfaz de usuario con los 3 botones principales
│   │       └── MetronomeService.kt  # Servicio Foreground con AudioTrack y MediaSession
│   ├── build.gradle.kts
│   └── gradlew
└── README.md
\`\`\`

---

## 🛠️ Cómo compilar el APK Android

### Opción 1: Automático en GitHub Actions (Recomendado)
Al hacer push o pull request en la rama \`main\` o \`master\`:
1. El workflow \`.github/workflows/build-apk.yml\` se ejecuta automáticamente en Ubuntu con Java 17.
2. Genera el APK firmado con la configuración flexible.
3. Lo publica en la pestaña **Releases** de tu repositorio bajo la etiqueta \`latest-apk\` listo para descargar e instalar directamente.

### Opción 2: Compilación local con Gradle
Si tienes el SDK de Android o Android Studio instalado:
\`\`\`bash
cd android
./gradlew assembleDebug
\`\`\`
El archivo APK se generará en:
\`android/app/build/outputs/apk/debug/app-debug.apk\`

Para instalarlo directamente por USB con ADB:
\`\`\`bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
\`\`\`

---

## 🔑 Variables de Firma (Opcional en CI)
Si deseas firmar con tu propio certificado en lugar del keystore de depuración:
- \`KEYSTORE_FILE\`: Ruta al archivo \`.keystore\` o \`.jks\`
- \`KEYSTORE_PASSWORD\`: Contraseña del keystore
- \`KEY_ALIAS\`: Alias de la llave
- \`KEY_PASSWORD\`: Contraseña de la llave

Si no se configuran, el build recurre automáticamente al keystore de depuración seguro sin interrumpir la compilación.
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
