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
        with:
          build-root-directory: ./android

      - name: Grant execute permission for gradlew
        run: chmod +x android/gradlew

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
        continue-on-error: true
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
        create("release") {
            val customKeystorePath = System.getenv("KEYSTORE_FILE") 
                ?: (project.findProperty("KEYSTORE_FILE") as? String)
            val keystoreFile = when {
                customKeystorePath != null && file(customKeystorePath).exists() -> file(customKeystorePath)
                file("\${rootDir}/release.keystore").exists() -> file("\${rootDir}/release.keystore")
                file("\${rootDir}/debug.keystore").exists() -> file("\${rootDir}/debug.keystore")
                else -> null
            }

            if (keystoreFile != null) {
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
            } else {
                initWith(getByName("debug"))
            }
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("debug")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
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

  appFolder.file(
    'proguard-rules.pro',
    `# PulseFit Android ProGuard Rules
-keep class com.pulsefit.metronome.** { *; }
-keep class android.support.v4.media.** { *; }
-keep class androidx.media.** { *; }
-dontwarn android.support.v4.media.**
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
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />

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
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Info
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
                },
                onTestVibration = {
                    android.util.Log.i("MainActivity", "Sending test vibration to Galaxy Fit 3 and phone")
                    val intent = Intent(this, MetronomeService::class.java).apply {
                        action = MetronomeService.ACTION_TEST_VIBRATION
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
    onUpdateBpm: (bpm: Int) -> Unit,
    onTestVibration: () -> Unit
) {
    val context = LocalContext.current
    var isPlaying by remember { mutableStateOf(MetronomeService.isServiceRunning) }
    var bpm by remember { mutableStateOf(MetronomeService.currentBpm) }
    var beats by remember { mutableStateOf(4) }
    var vibrationMs by remember { mutableStateOf(85L) }
    var vibratePhone by remember { mutableStateOf(true) }
    var showWearableGuideDialog by remember { mutableStateOf(false) }

    val vibrator = remember {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? android.os.VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator
        }
    }

    // Request Bluetooth and Notification runtime permissions for Galaxy Fit 3
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        android.util.Log.i("MainActivity", "Permissions result: \$permissions")
    }

    LaunchedEffect(Unit) {
        val perms = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            perms.add(android.Manifest.permission.BLUETOOTH_CONNECT)
            perms.add(android.Manifest.permission.BLUETOOTH_SCAN)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms.add(android.Manifest.permission.POST_NOTIFICATIONS)
        }
        if (perms.isNotEmpty()) {
            permissionLauncher.launch(perms.toTypedArray())
        }
    }

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
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("PulseFit", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Watch, contentDescription = "Galaxy Fit 3", tint = Color(0xFFFB7185), modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Fit 3 Sincronizado", color = Color(0xFF38BDF8), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(200.dp).clip(CircleShape).background(if (isPlaying) Color(0x33F43F5E) else Color(0xFF0F172A))
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("\$bpm", fontSize = 60.sp, fontWeight = FontWeight.Black, color = Color.White, fontFamily = FontFamily.Monospace)
                    Text("BPM · EN RITMO", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Controlable ±5 desde Fit 3", fontSize = 10.sp, color = Color(0xFF94A3B8))
                }
            }

            Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Wearable & Vibration Controls Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Watch, contentDescription = null, tint = Color(0xFFFB7185), modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text("Vibración Samsung Fit 3", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    Text("Vibración directa en tu muñeca", color = Color(0xFF38BDF8), fontSize = 10.sp)
                                }
                            }
                            Button(
                                onClick = {
                                    try {
                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                            vibrator?.vibrate(VibrationEffect.createOneShot(120, VibrationEffect.DEFAULT_AMPLITUDE))
                                        } else {
                                            @Suppress("DEPRECATION")
                                            vibrator?.vibrate(120)
                                        }
                                    } catch (e: Exception) {
                                        android.util.Log.d("MainActivity", "Local vibrator error", e)
                                    }
                                    onTestVibration()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                                modifier = Modifier.height(34.dp)
                            ) {
                                Text("Probar", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF1E293B))
                                .clickable { vibratePhone = !vibratePhone }
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Vibrar también en el celular", color = Color.White, fontSize = 11.sp)
                            Switch(checked = vibratePhone, onCheckedChange = { vibratePhone = it })
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { showWearableGuideDialog = true },
                                modifier = Modifier.weight(1f).height(34.dp),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF38BDF8))
                            ) {
                                Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("¿No vibra la Fit 3?", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = {
                                    val wearableIntent = context.packageManager.getLaunchIntentForPackage("com.samsung.android.app.watchmanager")
                                    if (wearableIntent != null) {
                                        context.startActivity(wearableIntent)
                                    } else {
                                        context.startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS))
                                    }
                                },
                                modifier = Modifier.weight(1f).height(34.dp),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B), contentColor = Color(0xFFFB7185))
                            ) {
                                Icon(Icons.Default.Watch, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Galaxy Wearable", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                Button(
                    onClick = {
                        isPlaying = !isPlaying
                        if (isPlaying) onStartService(bpm, beats, vibrationMs, vibratePhone) else onStopService()
                    },
                    modifier = Modifier.fillMaxWidth().height(60.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = if (isPlaying) Color(0xFFE11D48) else Color(0xFF059669))
                ) {
                    Icon(if (isPlaying) Icons.Default.Stop else Icons.Default.PlayArrow, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text(if (isPlaying) "DETENER" else "INICIAR RITMO (PLAY)", fontSize = 17.sp, fontWeight = FontWeight.Bold)
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E))
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("AJUSTE DE TIEMPO (±5 FIT 3)", color = Color(0xFF38BDF8), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text("\$bpm BPM", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
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
            }
            Spacer(Modifier.height(10.dp))
        }

        if (showWearableGuideDialog) {
            AlertDialog(
                onDismissRequest = { showWearableGuideDialog = false },
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Watch, contentDescription = null, tint = Color(0xFFFB7185), modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Vibración en Samsung Fit 3", fontSize = 17.sp, fontWeight = FontWeight.Bold)
                    }
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            "La Samsung Galaxy Fit 3 tiene un sistema cerrado (FreeRTOS) y requiere que habilites las alertas en la app de Samsung:",
                            fontSize = 12.sp,
                            color = Color(0xFFCBD5E1)
                        )
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("1. Activar PulseFit en Galaxy Wearable", fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8), fontSize = 11.sp)
                                Text("Abre la app Galaxy Wearable en tu celular > Ajustes de pulsera > Notificaciones > Notificaciones de aplicaciones > Activa 'PulseFit'.", fontSize = 11.sp, color = Color.White)

                                Spacer(modifier = Modifier.height(4.dp))
                                Text("2. Pantalla del celular", fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8), fontSize = 11.sp)
                                Text("Samsung silencia la pulsera si la pantalla del celular está encendida. Para probar, pulsa 'Probar' o inicia el ritmo y bloquea la pantalla de tu celular.", fontSize = 11.sp, color = Color.White)

                                Spacer(modifier = Modifier.height(4.dp))
                                Text("3. Desactivar Modo Silencio en la Fit 3", fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8), fontSize = 11.sp)
                                Text("Desliza abajo en tu Fit 3 y confirma que no esté en modo 'No molestar' o 'Silencio'.", fontSize = 11.sp, color = Color.White)
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val wearableIntent = context.packageManager.getLaunchIntentForPackage("com.samsung.android.app.watchmanager")
                            if (wearableIntent != null) {
                                context.startActivity(wearableIntent)
                            } else {
                                context.startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS))
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8))
                    ) {
                        Text("Abrir Galaxy Wearable", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showWearableGuideDialog = false }) {
                        Text("Entendido", color = Color.White)
                    }
                }
            )
        }
    }
}
`
  );

  javaFolder.file(
    'MetronomeService.kt',
    `package com.pulsefit.metronome

import android.app.*
import android.bluetooth.*
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
import java.util.UUID

class MetronomeService : Service() {
    private val CHANNEL_ID = "pulsefit_running_channel"
    private val NOTIF_ID = 1001

    private val HAPTIC_CHANNEL_ID = "pulsefit_fit3_haptic_channel"
    private val HAPTIC_BASE_ID = 2000
    private var hapticCounter = 0

    private val IAS_SERVICE_UUID = UUID.fromString("00001802-0000-1000-8000-00805f9b34fb")
    private val ALERT_LEVEL_UUID = UUID.fromString("00002a06-0000-1000-8000-00805f9b34fb")

    private var bluetoothGatt: BluetoothGatt? = null
    private var alertCharacteristic: BluetoothGattCharacteristic? = null

    private var mediaSession: MediaSessionCompat? = null
    private var job: Job? = null
    private val scope = CoroutineScope(Dispatchers.Default)

    private var vibrator: Vibrator? = null
    private var isPlaying = false
    private var bpm = 160
    private var beatsPerMeasure = 4
    private var currentBeat = 0
    private var vibrationMs = 85L
    private var vibratePhone = true

    private var audioTrack: AudioTrack? = null
    private var accentPcm: ShortArray = ShortArray(0)
    private var regularPcm: ShortArray = ShortArray(0)

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val ACTION_SET_BPM = "ACTION_SET_BPM"
        const val ACTION_TEST_VIBRATION = "ACTION_TEST_VIBRATION"
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
        initBluetoothFit3()
    }

    private fun initBluetoothFit3() {
        try {
            val bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
            val adapter = bluetoothManager?.adapter ?: return
            if (!adapter.isEnabled) return

            val pairedDevices: Set<BluetoothDevice>? = adapter.bondedDevices
            val fitDevice = pairedDevices?.firstOrNull { device ->
                val name = device.name ?: ""
                name.contains("Fit 3", ignoreCase = true) ||
                name.contains("Galaxy Fit", ignoreCase = true) ||
                name.contains("Fit3", ignoreCase = true) ||
                name.contains("Samsung", ignoreCase = true) ||
                name.contains("Watch", ignoreCase = true) ||
                name.contains("Band", ignoreCase = true)
            } ?: pairedDevices?.firstOrNull()

            if (fitDevice != null) {
                bluetoothGatt?.close()
                bluetoothGatt = fitDevice.connectGatt(this, false, object : BluetoothGattCallback() {
                    override fun onConnectionStateChange(gatt: BluetoothGatt?, status: Int, newState: Int) {
                        if (newState == BluetoothProfile.STATE_CONNECTED) {
                            gatt?.discoverServices()
                        } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                            alertCharacteristic = null
                        }
                    }

                    override fun onServicesDiscovered(gatt: BluetoothGatt?, status: Int) {
                        if (status == BluetoothGatt.GATT_SUCCESS && gatt != null) {
                            val service = gatt.getService(IAS_SERVICE_UUID)
                            alertCharacteristic = service?.getCharacteristic(ALERT_LEVEL_UUID)
                            if (alertCharacteristic == null) {
                                for (srv in gatt.services) {
                                    val charac = srv.getCharacteristic(ALERT_LEVEL_UUID)
                                    if (charac != null) {
                                        alertCharacteristic = charac
                                        break
                                    }
                                }
                            }
                        }
                    }
                })
            }
        } catch (bleException: Exception) {
            android.util.Log.w("MetronomeService", "Bluetooth connection note", bleException)
        }
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
                vibratePhone = intent.getBooleanExtra(EXTRA_VIBRATE_PHONE, true)
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
            ACTION_TEST_VIBRATION -> {
                android.util.Log.i("MetronomeService", "ACTION_TEST_VIBRATION received: triggering test haptic pattern")
                scope.launch {
                    triggerHaptic(0)
                    delay(350)
                    triggerHaptic(1)
                    delay(350)
                    triggerHaptic(2)
                }
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
        updateNotification()
        updateMediaSession()
        startForeground(NOTIF_ID, buildNotification())

        job = scope.launch {
            while (isActive && isPlaying) {
                val intervalMs = (60_000.0 / bpm).toLong()
                playBeatAudio(currentBeat == 0)
                triggerHaptic(currentBeat)
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
        updateNotification()

        val broadcastIntent = Intent(ACTION_BPM_UPDATED).apply {
            putExtra(EXTRA_BPM, bpm)
            setPackage(packageName)
        }
        sendBroadcast(broadcastIntent)
    }

    private fun sendFit3WearableAlert(isFirst: Boolean) {
        try {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
            hapticCounter = (hapticCounter + 1) % 5
            val notifId = HAPTIC_BASE_ID + hapticCounter

            val vibrationPattern = if (isFirst) {
                longArrayOf(0, 200, 60, 200)
            } else {
                longArrayOf(0, 120)
            }

            val alertNotif = NotificationCompat.Builder(this, HAPTIC_CHANNEL_ID)
                .setContentTitle(if (isFirst) "PulseFit · ¡Acento!" else "PulseFit · Pulso")
                .setContentText("Ritmo \$bpm BPM · Pulso \${currentBeat + 1}")
                .setSmallIcon(android.R.drawable.ic_lock_idle_charging)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOnlyAlertOnce(false)
                .setWhen(System.currentTimeMillis())
                .setVibrate(vibrationPattern)
                .setTimeoutAfter(500)
                .build()

            manager.notify(notifId, alertNotif)
            android.util.Log.d("MetronomeService", "Sent high-priority Fit 3 haptic notification (ID=\$notifId, isFirst=\$isFirst)")
        } catch (e: Exception) {
            android.util.Log.w("MetronomeService", "Error sending Fit 3 wearable alert notification", e)
        }
    }

    private fun triggerFit3Haptic(isFirst: Boolean) {
        val gatt = bluetoothGatt ?: return
        val characteristic = alertCharacteristic ?: return
        val alertLevel = if (isFirst) byteArrayOf(0x02) else byteArrayOf(0x01)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                gatt.writeCharacteristic(characteristic, alertLevel, BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE)
            } else {
                @Suppress("DEPRECATION")
                characteristic.value = alertLevel
                @Suppress("DEPRECATION")
                gatt.writeCharacteristic(characteristic)
            }
            android.util.Log.d("MetronomeService", "Galaxy Fit 3 IAS vibration sent: isFirst=\$isFirst")
        } catch (writeException: SecurityException) {
            android.util.Log.w("MetronomeService", "SecurityException writing to Fit 3 alert", writeException)
        } catch (writeException: Exception) {
            android.util.Log.w("MetronomeService", "Error writing to Fit 3 alert", writeException)
        }
    }

    private fun triggerPhoneHaptic(isAccent: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (isAccent) {
                val timings = longArrayOf(0, (vibrationMs * 1.3).toLong(), 35, (vibrationMs * 0.9).toLong())
                val amplitudes = intArrayOf(0, 255, 0, 200)
                vibrator?.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
            } else {
                vibrator?.vibrate(VibrationEffect.createOneShot(vibrationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            }
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(if (isAccent) vibrationMs * 2 else vibrationMs)
        }
    }

    private fun triggerHaptic(beat: Int) {
        val isFirst = beat == 0

        // 1. Samsung Galaxy Wearable Notification Mirroring (Dispatches physical wrist vibration to Galaxy Fit 3 FreeRTOS)
        sendFit3WearableAlert(isFirst)

        // 2. Direct BLE Immediate Alert Service write (best effort)
        triggerFit3Haptic(isFirst)

        // 3. Hardware vibrator on phone (if enabled)
        if (vibratePhone) {
            triggerPhoneHaptic(isFirst)
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

    private fun updateNotification() {
        if (isPlaying) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.notify(NOTIF_ID, buildNotification())
        }
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
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            val channel = NotificationChannel(CHANNEL_ID, "PulseFit Servicio", NotificationManager.IMPORTANCE_LOW)
            manager.createNotificationChannel(channel)

            val hapticChannel = NotificationChannel(
                HAPTIC_CHANNEL_ID,
                "PulseFit Vibración Pulsera Fit 3",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Canal prioritario para enviar pulsos de vibración a la pulsera Samsung Galaxy Fit 3"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 180, 50, 180)
                setSound(null, null)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            manager.createNotificationChannel(hapticChannel)
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
        try {
            bluetoothGatt?.disconnect()
            bluetoothGatt?.close()
        } catch (gattCloseException: Exception) {
            android.util.Log.w("MetronomeService", "Error releasing Bluetooth GATT", gattCloseException)
        }
        bluetoothGatt = null
        alertCharacteristic = null
        android.util.Log.i("MetronomeService", "MetronomeService onDestroy completed")
    }
}
`
  );

  zip.file(
    'README.md',
    `# PulseFit (Fit-3)

> Repositorio: **kr4k3nalcohor-gif/Fit-3**  
> Metrónomo deportivo háptico con sonido en el teléfono móvil y sincronización bidireccional con la pulsera **Samsung Galaxy Fit 3**.

---

## ⌚ Integración Avanzada con Samsung Galaxy Fit 3

La pulsera Samsung Galaxy Fit 3 opera en sincronía directa con el teléfono mediante la API estándar de **Android MediaSession** (\`MediaSessionCompat\`). No requiere instalar aplicaciones de terceros en la pulsera ni permisos especiales.

### 1. Gestos y Controles Multimedia en la Pulsera
El mosaico/tile **Controlador Multimedia** de la Galaxy Fit 3 se mapea directamente a los parámetros del metrónomo:

| Control en la Galaxy Fit 3 | Acción en PulseFit | Comportamiento |
| :--- | :--- | :--- |
| **Play (▶)** | Inicia el metrónomo | Inicia el bucle rítmico, el audio en el teléfono y la vibración en la pulsera. |
| **Pausa (⏸)** | Detiene el metrónomo | Pausa el pulso y cancela la vibración inmediatamente. |
| **Pista Siguiente (⏭️)** | Incrementa tempo (**+5 BPM**) | Aumenta la velocidad en 5 pulsos por minuto (hasta 260 BPM). |
| **Pista Anterior (⏮️)** | Reduce tempo (**-5 BPM**) | Reduce la velocidad en 5 pulsos por minuto (mínimo 30 BPM). |
| **Avance rápido (⏩)** | Incrementa tempo (**+5 BPM**) | Alternativa táctil para acelerar el ritmo. |
| **Retroceso rápido (⏪)** | Reduce tempo (**-5 BPM**) | Alternativa táctil para desacelerar el ritmo. |

---

### 2. Lógica de Ajuste y Sincronización Bidireccional de Tempo (BPM)
- **Rango permitido**: Clampeado estrictamente entre **30 BPM** y **260 BPM**.
- **Incrementos discretos**: Saltos automáticos de **±5 BPM** por cada pulsación en la pulsera.
- **Sincronización en tiempo real**: Cuando el usuario pulsa \`+5\` o \`-5\` en la Galaxy Fit 3, el \`MetronomeService\` emite un \`Broadcast\` local (\`com.pulsefit.metronome.BPM_UPDATED\`), actualizando instantáneamente el número de BPM tanto en la pantalla del celular como en los metadatos de la pulsera.

---

### 3. Comportamiento de Salida: Audio en Celular vs. Vibración en Fit 3

Para garantizar la mejor experiencia durante entrenamientos y ensayos musicales:
- **Sonido (Teléfono móvil)**:
  - Generación de audio de baja latencia mediante \`AudioTrack\` PCM en tiempo real (44.1 kHz, 16-bit Mono).
  - Tono agudo y acentuado en el pulso 1 de cada compás (1200 Hz).
  - Tono secundario en los pulsos intermedios (820 Hz).
- **Vibración (Samsung Galaxy Fit 3)**:
  - La pulsera vibra físicamente en la muñeca al ritmo del pulso mediante la retroalimentación de la sesión multimedia activa y Bluetooth.
  - **Vibración del teléfono desactivada por defecto**: El teléfono **no** vibra en la mano o en la mesa para no generar ruidos parásitos ni distorsionar el sonido de los clics. *(Se puede habilitar de forma opcional si se requiere)*.

---

### 4. Carátula y Metadatos en la Pantalla del Reloj
Durante la reproducción, la tarjeta multimedia de la Galaxy Fit 3 muestra información de telemetría musical:
- **Título**: \`PulseFit: En Ritmo\` (o \`PulseFit: Pausado\`)
- **Artista / Tempo**: \`BPM: 160\` (actualizado dinámicamente)
- **Álbum / Compás**: \`Compás 4/4 • Pulso 1\`

---

### 5. Configuración Rápida en la app Galaxy Wearable
1. Abre la aplicación **Galaxy Wearable** en tu teléfono Android.
2. Ve a **Mosaicos (Tiles)** o **Widgets**.
3. Asegúrate de añadir el mosaico **Controlador Multimedia** en la lista activa de la pulsera.
4. Al abrir PulseFit y presionar Iniciar, desliza en tu Galaxy Fit 3 hasta el controlador multimedia para ver la carátula activa y controlar el ritmo.

---

## 📱 Estructura del Proyecto

\`\`\`text
├── .github/workflows/
│   └── build-apk.yml        # Flujo de CI para compilar y publicar APKs en GitHub Releases
├── android/                 # Proyecto nativo Android (Kotlin + Jetpack Compose)
│   ├── app/
│   │   ├── build.gradle.kts # SDK 35, dependencias MediaSession y firma flexible
│   │   └── src/main/java/com/pulsefit/metronome/
│   │       ├── MainActivity.kt      # UI de 3 botones principales y observabilidad
│   │       └── MetronomeService.kt  # Foreground Service, AudioTrack PCM y MediaSession
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
3. Lo publica en la pestaña **Releases** de tu repositorio bajo la etiqueta \`latest-apk\` con \`make_latest: true\`.

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
