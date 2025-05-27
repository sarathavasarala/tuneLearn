// Audio Engine for Piano Sounds and Audio Management

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.oscillators = new Map(); // Track active oscillators
        this.gainNodes = new Map(); // Track gain nodes
        this.masterGain = null;
        this.isInitialized = false;
        this.sampleRate = 44100;
        
        // Metronome properties
        this.metronome = {
            isPlaying: false,
            bpm: 120,
            intervalId: null,
            clickOscillator: null,
            beat: 0
        };
        
        // Recording properties
        this.recording = {
            isRecording: false,
            events: [],
            startTime: null
        };
        
        // Audio settings
        this.settings = {
            volume: 0.7,
            attack: 0.01,
            decay: 0.2,
            sustain: 0.7,
            release: 0.5,
            waveform: 'triangle' // triangle, sine, square, sawtooth
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.settings.volume;
            
            this.isInitialized = true;
            console.log('Audio Engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Audio Engine:', error);
        }
    }
    
    // Resume audio context (required for user interaction)
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    // Play a piano note using Web Audio API
    playNote(note, octave = 4, velocity = 0.8, duration = null) {
        if (!this.isInitialized) return;
        
        this.resumeContext();
        
        const frequency = MusicTheory.midiToFrequency(MusicTheory.noteToMidi(note, octave));
        const noteKey = `${note}${octave}`;
        
        // Stop existing note if playing
        this.stopNote(noteKey);
        
        // Create oscillator and gain node
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Configure oscillator
        oscillator.type = this.settings.waveform;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Connect audio graph
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Configure ADSR envelope
        const now = this.audioContext.currentTime;
        const { attack, decay, sustain, release } = this.settings;
        const maxGain = velocity * 0.3; // Scale down to prevent clipping
        
        // Attack
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(maxGain, now + attack);
        
        // Decay to sustain
        gainNode.gain.linearRampToValueAtTime(maxGain * sustain, now + attack + decay);
        
        // Start oscillator
        oscillator.start(now);
        
        // Store references
        this.oscillators.set(noteKey, oscillator);
        this.gainNodes.set(noteKey, gainNode);
        
        // If duration is specified, schedule note off
        if (duration) {
            setTimeout(() => this.stopNote(noteKey), duration * 1000);
        }
        
        // Record the event if recording
        if (this.recording.isRecording) {
            this.recording.events.push({
                type: 'noteOn',
                note: note,
                octave: octave,
                velocity: velocity,
                time: Date.now() - this.recording.startTime
            });
        }
        
        return noteKey;
    }
    
    // Stop a piano note
    stopNote(noteKey) {
        const oscillator = this.oscillators.get(noteKey);
        const gainNode = this.gainNodes.get(noteKey);
        
        if (oscillator && gainNode) {
            const now = this.audioContext.currentTime;
            const release = this.settings.release;
            
            // Release envelope
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.linearRampToValueAtTime(0, now + release);
            
            // Stop oscillator after release
            oscillator.stop(now + release);
            
            // Clean up references
            this.oscillators.delete(noteKey);
            this.gainNodes.delete(noteKey);
            
            // Record the event if recording
            if (this.recording.isRecording) {
                const noteInfo = noteKey.match(/([A-G]#?)(\d+)/);
                if (noteInfo) {
                    this.recording.events.push({
                        type: 'noteOff',
                        note: noteInfo[1],
                        octave: parseInt(noteInfo[2]),
                        time: Date.now() - this.recording.startTime
                    });
                }
            }
        }
    }
    
    // Play a chord
    playChord(notes, octave = 4, velocity = 0.6, duration = null) {
        const playedNotes = [];
        notes.forEach((note, index) => {
            // Slight delay for natural chord feel
            setTimeout(() => {
                const noteKey = this.playNote(note, octave, velocity, duration);
                playedNotes.push(noteKey);
            }, index * 10);
        });
        return playedNotes;
    }
    
    // Stop all notes
    stopAllNotes() {
        const noteKeys = [...this.oscillators.keys()];
        noteKeys.forEach(noteKey => this.stopNote(noteKey));
    }
    
    // Metronome functions
    startMetronome(bpm = 120) {
        this.stopMetronome();
        
        this.metronome.bpm = bpm;
        this.metronome.isPlaying = true;
        this.metronome.beat = 0;
        
        const interval = (60 / bpm) * 1000; // Convert BPM to milliseconds
        
        this.metronome.intervalId = setInterval(() => {
            this.playMetronomeClick();
            this.metronome.beat = (this.metronome.beat + 1) % 4;
        }, interval);
        
        // Play first click immediately
        this.playMetronomeClick();
    }
    
    stopMetronome() {
        if (this.metronome.intervalId) {
            clearInterval(this.metronome.intervalId);
            this.metronome.intervalId = null;
        }
        this.metronome.isPlaying = false;
        this.metronome.beat = 0;
    }
    
    playMetronomeClick() {
        if (!this.isInitialized) return;
        
        this.resumeContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Different frequency for downbeat
        const frequency = this.metronome.beat === 0 ? 800 : 400;
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }
    
    // Recording functions
    startRecording() {
        this.recording.isRecording = true;
        this.recording.events = [];
        this.recording.startTime = Date.now();
        console.log('Recording started');
    }
    
    stopRecording() {
        this.recording.isRecording = false;
        console.log('Recording stopped');
        return this.recording.events;
    }
    
    // Playback recorded events
    async playbackRecording(events, speed = 1.0) {
        if (!events || events.length === 0) return;
        
        console.log('Playing back recording...');
        
        for (const event of events) {
            const delay = event.time / speed;
            
            setTimeout(() => {
                if (event.type === 'noteOn') {
                    this.playNote(event.note, event.octave, event.velocity);
                } else if (event.type === 'noteOff') {
                    this.stopNote(`${event.note}${event.octave}`);
                }
            }, delay);
        }
    }
    
    // Audio settings
    setVolume(volume) {
        this.settings.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.settings.volume;
        }
    }
    
    setWaveform(waveform) {
        if (['sine', 'square', 'sawtooth', 'triangle'].includes(waveform)) {
            this.settings.waveform = waveform;
        }
    }
    
    setEnvelope(attack, decay, sustain, release) {
        this.settings.attack = Math.max(0.001, attack);
        this.settings.decay = Math.max(0.001, decay);
        this.settings.sustain = Math.max(0, Math.min(1, sustain));
        this.settings.release = Math.max(0.001, release);
    }
    
    // Create noise for percussion sounds
    createNoise(duration = 0.1, frequency = 1000) {
        if (!this.isInitialized) return;
        
        this.resumeContext();
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        source.start(now);
        source.stop(now + duration);
    }
    
    // Audio visualization data
    createAnalyser() {
        if (!this.isInitialized) return null;
        
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        this.masterGain.connect(analyser);
        
        return analyser;
    }
    
    // Preset configurations
    loadPreset(presetName) {
        const presets = {
            piano: {
                waveform: 'triangle',
                attack: 0.01,
                decay: 0.2,
                sustain: 0.7,
                release: 0.5
            },
            organ: {
                waveform: 'sine',
                attack: 0.05,
                decay: 0.1,
                sustain: 0.9,
                release: 0.3
            },
            strings: {
                waveform: 'sawtooth',
                attack: 0.3,
                decay: 0.1,
                sustain: 0.8,
                release: 1.0
            },
            brass: {
                waveform: 'square',
                attack: 0.1,
                decay: 0.2,
                sustain: 0.6,
                release: 0.4
            }
        };
        
        const preset = presets[presetName];
        if (preset) {
            this.settings = { ...this.settings, ...preset };
        }
    }
    
    // Cleanup
    destroy() {
        this.stopAllNotes();
        this.stopMetronome();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioEngine;
} else {
    window.AudioEngine = AudioEngine;
}
