# PulseFit (Fit-3)

> Repositorio: **kr4k3nalcohor-gif/Fit-3**  
> Metrónomo háptico con sonido en el teléfono móvil y control/vibración en la pulsera **Samsung Galaxy Fit 3**.

---

## ⌚ ¿Cómo funciona con la Samsung Galaxy Fit 3?

La Samsung Galaxy Fit 3 no requiere apps de terceros gracias al estándar **Android MediaSession**:

1. **Controlador multimedia de la Fit 3**:
   - **Play / Pausa**: Inicia o detiene el pulso del metrónomo.
   - **Pista siguiente (⏭️)**: Aumenta el tempo **+5 BPM**.
   - **Pista anterior (⏮️)**: Reduce el tempo **-5 BPM**.
   - **Carátula en la pulsera**: Muestra el BPM actual, el compás (ej. `4/4`) y el número de pulso activo.

2. **División de salida acústica y háptica**:
   - **Teléfono móvil**: Emite el sonido de clic de metrónomo (con acento en el primer tiempo) mediante `AudioTrack` PCM de baja latencia.
   - **Samsung Galaxy Fit 3**: Recibe la vibración háptica en la muñeca al ritmo exacto.
   - *(Opcional)*: La vibración en el teléfono móvil puede activarse o desactivarse desde los ajustes (por defecto solo vibra la pulsera).

---

## 📱 Estructura del Proyecto

El repositorio incluye tanto la versión web/PWA como el código fuente nativo de Android:

```text
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
├── src/                     # Aplicación Web React + TypeScript + Simulador Galaxy Fit 3
│   ├── components/          # Simulador de Fit 3, modales de tempo, compás y guía
│   └── services/            # AudioEngine, Web Haptics, MediaSession y generador ZIP
└── package.json
```

---

## 🛠️ Cómo compilar el APK Android

### Opción 1: Automático en GitHub Actions (Recomendado)
Al hacer push o pull request en la rama `main` o `master`:
1. El workflow `.github/workflows/build-apk.yml` se ejecuta automáticamente en Ubuntu con Java 17.
2. Genera el APK firmado con la configuración flexible.
3. Lo publica en la pestaña **Releases** de tu repositorio bajo la etiqueta `latest-apk` listo para descargar e instalar directamente.

### Opción 2: Compilación local con Gradle
Si tienes el SDK de Android o Android Studio instalado:
```bash
cd android
./gradlew assembleDebug
```
El archivo APK se generará en:
`android/app/build/outputs/apk/debug/app-debug.apk`

Para instalarlo directamente por USB con ADB:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔑 Variables de Firma (Opcional en CI)
Si deseas firmar con tu propio certificado en lugar del keystore de depuración:
- `KEYSTORE_FILE`: Ruta al archivo `.keystore` o `.jks`
- `KEYSTORE_PASSWORD`: Contraseña del keystore
- `KEY_ALIAS`: Alias de la llave
- `KEY_PASSWORD`: Contraseña de la llave

Si no se configuran, el build recurre automáticamente al keystore de depuración seguro sin interrumpir la compilación.
