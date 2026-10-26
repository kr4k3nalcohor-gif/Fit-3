# PulseFit (Fit-3)

> Repositorio: **kr4k3nalcohor-gif/Fit-3**  
> Metrónomo deportivo háptico con sonido en el teléfono móvil y sincronización bidireccional con la pulsera **Samsung Galaxy Fit 3**.

---

## ⌚ Integración Avanzada con Samsung Galaxy Fit 3

La pulsera Samsung Galaxy Fit 3 opera en sincronía directa con el teléfono mediante la API estándar de **Android MediaSession** (`MediaSessionCompat`). No requiere instalar aplicaciones de terceros en la pulsera ni permisos especiales.

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
- **Sincronización en tiempo real**: Cuando el usuario pulsa `+5` o `-5` en la Galaxy Fit 3, el `MetronomeService` emite un `Broadcast` local (`com.pulsefit.metronome.BPM_UPDATED`), actualizando instantáneamente el número de BPM tanto en la pantalla del celular como en los metadatos de la pulsera.

---

### 3. Comportamiento de Salida: Audio en Celular vs. Vibración en Fit 3

Para garantizar la mejor experiencia durante entrenamientos y ensayos musicales:
- **Sonido (Teléfono móvil)**:
  - Generación de audio de baja latencia mediante `AudioTrack` PCM en tiempo real (44.1 kHz, 16-bit Mono).
  - Tono agudo y acentuado en el pulso 1 de cada compás (1200 Hz).
  - Tono secundario en los pulsos intermedios (820 Hz).
- **Vibración (Samsung Galaxy Fit 3)**:
  - La pulsera vibra físicamente en la muñeca al ritmo del pulso mediante la retroalimentación de la sesión multimedia activa y Bluetooth.
  - **Vibración del teléfono desactivada por defecto**: El teléfono **no** vibra en la mano o en la mesa para no generar ruidos parásitos ni distorsionar el sonido de los clics. *(Se puede habilitar de forma opcional si se requiere)*.

---

### 4. Carátula y Metadatos en la Pantalla del Reloj
Durante la reproducción, la tarjeta multimedia de la Galaxy Fit 3 muestra información de telemetría musical:
- **Título**: `PulseFit: En Ritmo` (o `PulseFit: Pausado`)
- **Artista / Tempo**: `BPM: 160` (actualizado dinámicamente)
- **Álbum / Compás**: `Compás 4/4 • Pulso 1`

---

### 5. Configuración Rápida en la app Galaxy Wearable
1. Abre la aplicación **Galaxy Wearable** en tu teléfono Android.
2. Ve a **Mosaicos (Tiles)** o **Widgets**.
3. Asegúrate de añadir el mosaico **Controlador Multimedia** en la lista activa de la pulsera.
4. Al abrir PulseFit y presionar Iniciar, desliza en tu Galaxy Fit 3 hasta el controlador multimedia para ver la carátula activa y controlar el ritmo.

---

## 📱 Estructura del Proyecto

```text
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
├── src/                     # App Web React + TypeScript + Simulador Galaxy Fit 3
│   ├── components/          # Simulador Fit 3, modales de tempo, compás y guía
│   └── services/            # AudioEngine, Web Haptics, MediaSession y generador ZIP
└── package.json
```

---

## 🛠️ Cómo compilar el APK Android

### Opción 1: Automático en GitHub Actions (Recomendado)
Al hacer push o pull request en la rama `main` o `master`:
1. El workflow `.github/workflows/build-apk.yml` se ejecuta automáticamente en Ubuntu con Java 17.
2. Genera el APK firmado con la configuración flexible.
3. Lo publica en la pestaña **Releases** de tu repositorio bajo la etiqueta `latest-apk` con `make_latest: true`.

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
