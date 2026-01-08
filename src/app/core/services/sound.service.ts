import { Injectable } from '@angular/core';

export type SoundType = 'start' | 'reveal' | 'vote' | 'complete' | 'cancel';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled = true;
  private readonly STORAGE_KEY = 'planning-poker-sound-enabled';

  constructor() {
    this.initializeSounds();
    this.loadSoundPreference();
  }

  /**
   * Cargar preferencia de sonido desde localStorage
   */
  private loadSoundPreference() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored !== null) {
        this.enabled = stored === 'true';
        console.log(`SoundService: Loaded sound preference from localStorage: ${this.enabled}`);
      }
    } catch (error) {
      console.warn('SoundService: Error loading sound preference from localStorage:', error);
    }
  }

  /**
   * Guardar preferencia de sonido en localStorage
   */
  private saveSoundPreference() {
    try {
      localStorage.setItem(this.STORAGE_KEY, String(this.enabled));
      console.log(`SoundService: Saved sound preference to localStorage: ${this.enabled}`);
    } catch (error) {
      console.warn('SoundService: Error saving sound preference to localStorage:', error);
    }
  }

  private initializeSounds() {
    // Usar sonidos generados con Web Audio API
    this.sounds.set('start', this.createBeep(800, 0.1, 'sine'));      // Beep alto para iniciar
    this.sounds.set('reveal', this.createBeep(600, 0.15, 'triangle')); // Beep medio para revelar
    this.sounds.set('vote', this.createBeep(400, 0.08, 'sine'));       // Beep corto para votar
    this.sounds.set('complete', this.createChord());                    // Acorde para completar
    this.sounds.set('cancel', this.createBeep(300, 0.12, 'sawtooth')); // Beep bajo para cancelar
  }

  /**
   * Crear un beep simple usando Web Audio API
   */
  private createBeep(frequency: number, duration: number, type: OscillatorType = 'sine'): HTMLAudioElement {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    // Crear un audio element que se puede reproducir
    const audio = new Audio();
    
    // Guardar la función de reproducción
    (audio as any).playSound = () => {
      const newOscillator = audioContext.createOscillator();
      const newGainNode = audioContext.createGain();
      
      newOscillator.connect(newGainNode);
      newGainNode.connect(audioContext.destination);
      
      newOscillator.frequency.value = frequency;
      newOscillator.type = type;
      
      newGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      newOscillator.start(audioContext.currentTime);
      newOscillator.stop(audioContext.currentTime + duration);
    };

    return audio;
  }

  /**
   * Crear un acorde de éxito (múltiples frecuencias)
   */
  private createChord(): HTMLAudioElement {
    const audio = new Audio();
    
    (audio as any).playSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const frequencies = [523.25, 659.25, 783.99]; // Do, Mi, Sol (acorde mayor)
      const duration = 0.3;

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const delay = index * 0.05;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);

        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      });
    };

    return audio;
  }

  /**
   * Reproducir un sonido específico
   */
  play(type: SoundType) {
    if (!this.enabled) {
      return;
    }

    try {
      const sound = this.sounds.get(type);
      if (sound && (sound as any).playSound) {
        (sound as any).playSound();
      }
    } catch (error) {
      console.warn('SoundService: Error playing sound:', error);
    }
  }

  /**
   * Habilitar o deshabilitar sonidos
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.saveSoundPreference();
    console.log(`SoundService: Sounds ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Verificar si los sonidos están habilitados
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
