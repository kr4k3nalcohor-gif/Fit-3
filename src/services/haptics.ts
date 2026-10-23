import { HapticConfig, HapticIntensity } from '../types/metronome';

interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<{
    getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
  }>;
}

interface BluetoothDevice {
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothNavigator extends Navigator {
  bluetooth?: {
    requestDevice(options: unknown): Promise<BluetoothDevice>;
  };
}

export const HAPTIC_PRESETS: Record<HapticIntensity, { label: string; durationMs: number; description: string }> = {
  off: { label: 'Desactivada', durationMs: 0, description: 'Sin vibración háptica' },
  low: { label: 'Suave', durationMs: 25, description: 'Pulso ligero y discreto' },
  medium: { label: 'Media', durationMs: 50, description: 'Equilibrada para caminar o trote suave' },
  high: { label: 'Fuerte (Running)', durationMs: 85, description: 'Óptima para correr y brazadas intensas' },
  ultra: { label: 'Máxima Potencia', durationMs: 125, description: 'Alta energía, perceptible en sprint o ciclismo' },
};

class HapticsService {
  private bleDevice: BluetoothDevice | null = null;
  private alertCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  public triggerHaptic(beatNumber: number, config: HapticConfig) {
    if (config.intensity === 'off') return;

    const baseMs = config.durationMs || HAPTIC_PRESETS[config.intensity].durationMs;
    const isAccent = beatNumber === 0 && config.accentFirstBeat;

    if (config.vibrateOnPhone && 'vibrate' in navigator) {
      try {
        if (isAccent) {
          // Double buzz for the first beat
          navigator.vibrate([baseMs * 1.3, 35, baseMs * 0.9]);
        } else {
          // Crisp single pulse
          navigator.vibrate(baseMs);
        }
      } catch {
        // Ignore vibration restrictions if tab lost focus or browser denies
      }
    }

    // If connected via Web Bluetooth GATT Immediate Alert
    if (config.vibrateOnFit3 && this.alertCharacteristic) {
      try {
        const alertLevel = isAccent ? 2 : 1; // 2 = High Alert, 1 = Mild Alert
        this.alertCharacteristic.writeValue(new Uint8Array([alertLevel]));
      } catch {
        // Silent catch for GATT write
      }
    }
  }

  public testHaptic(intensity: HapticIntensity, isAccent: boolean = false) {
    if (intensity === 'off') return;
    const baseMs = HAPTIC_PRESETS[intensity].durationMs;
    if ('vibrate' in navigator) {
      try {
        if (isAccent) {
          navigator.vibrate([baseMs * 1.3, 35, baseMs * 0.9]);
        } else {
          navigator.vibrate(baseMs);
        }
      } catch {}
    }
  }

  public async connectBluetoothWearable(): Promise<{ success: boolean; name?: string; error?: string }> {
    const nav = navigator as BluetoothNavigator;
    if (!nav.bluetooth) {
      return {
        success: false,
        error: 'Web Bluetooth no está habilitado en este navegador. Puedes usar el widget de reproductor multimedia de Galaxy Fit 3.',
      };
    }

    try {
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Galaxy Fit' },
          { namePrefix: 'Fit3' },
          { namePrefix: 'Galaxy' },
          { services: ['immediate_alert'] },
          { services: ['heart_rate'] },
        ],
        optionalServices: ['immediate_alert', 'alert_notification', 0x1802, 0x1800],
      });

      this.bleDevice = device;
      const server = await device.gatt?.connect();
      if (server) {
        try {
          const service = await server.getPrimaryService('immediate_alert');
          this.alertCharacteristic = await service.getCharacteristic(0x2a06);
        } catch {
          // service not exposed, device still paired for presence
        }
      }

      return { success: true, name: device.name || 'Samsung Galaxy Fit 3' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancelado por usuario';
      return { success: false, error: msg };
    }
  }

  public disconnectBluetooth() {
    if (this.bleDevice && this.bleDevice.gatt?.connected) {
      this.bleDevice.gatt.disconnect();
    }
    this.bleDevice = null;
    this.alertCharacteristic = null;
  }
}

export const hapticsService = new HapticsService();
