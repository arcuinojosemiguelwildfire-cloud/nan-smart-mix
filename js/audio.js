/**
 * Audio Manager - Sound Effects using Web Audio API
 * Generates sounds programmatically (no external files needed)
 * Easy to replace with actual audio files later
 */

class AudioManager {
  constructor() {
    // Initialize audio context (with browser compatibility)
    this.audioContext = null;
    this.enabled = true;
    
    // Try to initialize audio context on user interaction
    this.initAudioContext();
  }

  /**
   * Initialize audio context (must be triggered by user interaction)
   */
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  /**
   * Ensure audio context is running (resume if suspended)
   */
  ensureAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Play a tone with specified parameters
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {string} type - Oscillator type: 'sine', 'square', 'sawtooth', 'triangle'
   * @param {number} volume - Volume (0-1)
   */
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;
    
    this.ensureAudioContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Play success sound (pleasant ascending chord)
   */
  playSuccess() {
    if (!this.enabled) return;
    
    // Play a C major chord (C5, E5, G5)
    this.playTone(523.25, 0.3, 'sine', 0.2); // C5
    setTimeout(() => this.playTone(659.25, 0.3, 'sine', 0.2), 50); // E5
    setTimeout(() => this.playTone(783.99, 0.3, 'sine', 0.2), 100); // G5
  }

  /**
   * Play error sound (low-pitched buzz)
   */
  playError() {
    if (!this.enabled) return;
    
    // Play a dissonant low tone
    this.playTone(200, 0.3, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(180, 0.3, 'sawtooth', 0.15), 100);
  }

  /**
   * Play completion/celebration sound (ascending melody)
   */
  playCompletion() {
    if (!this.enabled) return;
    
    // Play an ascending celebration melody
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C5, D5, E5, G5, A5, C6
    const duration = 0.15;
    
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.playTone(note, duration, 'sine', 0.25);
      }, index * 100);
    });
  }

  /**
   * Play drag start sound (subtle click)
   */
  playDragStart() {
    if (!this.enabled) return;
    
    // Very subtle click sound
    this.playTone(800, 0.05, 'sine', 0.1);
  }

  /**
   * Play hint sound (gentle chime)
   */
  playHint() {
    if (!this.enabled) return;
    
    // Play a gentle two-tone chime
    this.playTone(880, 0.2, 'sine', 0.15); // A5
    setTimeout(() => this.playTone(1108.73, 0.2, 'sine', 0.15), 100); // C#6
  }
}
