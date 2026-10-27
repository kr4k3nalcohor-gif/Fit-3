plugins {
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
                file("${rootDir}/release.keystore").exists() -> file("${rootDir}/release.keystore")
                file("${rootDir}/debug.keystore").exists() -> file("${rootDir}/debug.keystore")
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
    
    // MediaSession for Samsung Galaxy Fit 3 Card/Tile control
    implementation("androidx.media:media:1.7.0")
}
