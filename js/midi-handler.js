// MIDI Handler for External MIDI Keyboard Integration

class MIDIHandler {
    constructor() {
        this.midiAccess = null;
        this.connectedDevices = new Map();
        this.isEnabled = false;
        
        // MIDI event listeners
        this.onNoteOn = null;
        this.onNoteOff = null;
        this.onControlChange = null;
        
        // Velocity curve settings
        this.velocityCurve = 'linear'; // linear, logarithmic, exponential
        this.velocityScale = 1.0;
    }
    
    async init() {
        // Check if Web MIDI API is supported
        if (!navigator.requestMIDIAccess) {
            console.warn('Web MIDI API not supported in this browser');
            this.showMIDIError('Web MIDI API not supported. Please use Chrome, Edge, or Opera.');
            return;
        }
        
        try {
            // Request MIDI access
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            
            // Set up event listeners
            this.midiAccess.onstatechange = this.onStateChange.bind(this);
            
            // Scan for already connected devices
            this.scanExistingDevices();
            
            // Initialize connected devices
            this.updateDeviceList();
            
            this.isEnabled = true;
            console.log('MIDI Handler initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize MIDI:', error);
            this.showMIDIError('Failed to access MIDI devices. Please check browser permissions.');
        }
    }
    
    // Handle MIDI device state changes
    onStateChange(event) {
        const port = event.port;
        console.log(`MIDI ${port.type} ${port.state}: ${port.name}`);
        
        if (port.type === 'input') {
            if (port.state === 'connected') {
                this.addInputDevice(port);
            } else if (port.state === 'disconnected') {
                this.removeInputDevice(port);
            }
        }
        
        this.updateDeviceList();
    }
    
    // Add MIDI input device
    addInputDevice(port) {
        if (this.connectedDevices.has(port.id)) return;
        
        // Set up message handler
        port.onmidimessage = this.onMIDIMessage.bind(this);
        
        this.connectedDevices.set(port.id, {
            port: port,
            name: port.name,
            manufacturer: port.manufacturer || 'Unknown',
            isActive: false
        });
        
        console.log(`Added MIDI device: ${port.name}`);
    }
    
    // Remove MIDI input device
    removeInputDevice(port) {
        if (this.connectedDevices.has(port.id)) {
            this.connectedDevices.delete(port.id);
            console.log(`Removed MIDI device: ${port.name}`);
        }
    }
    
    // Handle incoming MIDI messages
    onMIDIMessage(event) {
        const [status, note, velocity] = event.data;
        const command = status & 0xF0;
        const channel = status & 0x0F;
        
        switch (command) {
            case 0x90: // Note On
                if (velocity > 0) {
                    this.handleNoteOn(note, velocity, channel);
                } else {
                    this.handleNoteOff(note, channel);
                }
                break;
                
            case 0x80: // Note Off
                this.handleNoteOff(note, channel);
                break;
                
            case 0xB0: // Control Change
                this.handleControlChange(note, velocity, channel);
                break;
                
            case 0xC0: // Program Change
                this.handleProgramChange(note, channel);
                break;
                
            case 0xE0: // Pitch Bend
                this.handlePitchBend(note, velocity, channel);
                break;
                
            default:
                console.log(`Unhandled MIDI command: ${command.toString(16)}`);
        }
    }
    
    // Handle MIDI Note On
    handleNoteOn(midiNote, velocity, channel) {
        const noteName = this.midiToNoteName(midiNote);
        const scaledVelocity = this.scaleVelocity(velocity);
        
        console.log(`MIDI Note On: ${noteName} (velocity: ${velocity})`);
        
        // Trigger custom callback
        if (this.onNoteOn) {
            this.onNoteOn(noteName, scaledVelocity);
        }
    }
    
    // Handle MIDI Note Off
    handleNoteOff(midiNote, channel) {
        const noteName = this.midiToNoteName(midiNote);
        
        console.log(`MIDI Note Off: ${noteName}`);
        
        // Trigger custom callback
        if (this.onNoteOff) {
            this.onNoteOff(noteName);
        }
    }
    
    // Handle MIDI Control Change
    handleControlChange(controller, value, channel) {
        console.log(`MIDI CC: Controller ${controller}, Value ${value}, Channel ${channel}`);
        
        // Common MIDI controllers
        switch (controller) {
            case 1: // Modulation wheel
                this.handleModulationWheel(value);
                break;
                
            case 7: // Volume
                this.handleVolumeControl(value);
                break;
                
            case 64: // Sustain pedal
                this.handleSustainPedal(value);
                break;
                
            case 123: // All notes off
                this.handleAllNotesOff();
                break;
                
            default:
                // Trigger custom callback
                if (this.onControlChange) {
                    this.onControlChange(controller, value, channel);
                }
        }
    }
    
    // Handle Program Change
    handleProgramChange(program, channel) {
        console.log(`MIDI Program Change: ${program}, Channel ${channel}`);
        
        // Could be used to switch instrument presets
        if (this.audioEngine) {
            const presets = ['piano', 'organ', 'strings', 'brass'];
            const presetIndex = program % presets.length;
            this.audioEngine.loadPreset(presets[presetIndex]);
        }
    }
    
    // Handle Pitch Bend
    handlePitchBend(lsb, msb, channel) {
        const pitchBend = (msb << 7) | lsb;
        const normalizedBend = (pitchBend - 8192) / 8192; // -1 to 1
        
        console.log(`MIDI Pitch Bend: ${normalizedBend.toFixed(3)}, Channel ${channel}`);
        
        // Pitch bend could be implemented in the audio engine
        // For now, just log it
    }
    
    // Handle specific control change messages
    handleModulationWheel(value) {
        // Could add vibrato or other modulation effects
        console.log(`Modulation: ${value}`);
    }
    
    handleVolumeControl(value) {
        if (this.audioEngine) {
            const volume = value / 127;
            this.audioEngine.setVolume(volume);
        }
    }
    
    handleSustainPedal(value) {
        const isPressed = value >= 64;
        console.log(`Sustain pedal: ${isPressed ? 'pressed' : 'released'}`);
        
        // Could implement sustain functionality
        if (!isPressed && this.audioEngine) {
            // Release sustained notes when pedal is released
            // This would require tracking sustained notes
        }
    }
    
    handleAllNotesOff() {
        if (this.audioEngine) {
            this.audioEngine.stopAllNotes();
        }
        
        if (this.pianoKeyboard) {
            this.pianoKeyboard.releaseAllKeys();
        }
    }
    
    // Scale MIDI velocity (0-127) to audio velocity (0-1)
    scaleVelocity(velocity) {
        const normalized = velocity / 127;
        
        switch (this.velocityCurve) {
            case 'logarithmic':
                return Math.log(normalized * 9 + 1) / Math.log(10);
                
            case 'exponential':
                return Math.pow(normalized, 2);
                
            case 'linear':
            default:
                return normalized * this.velocityScale;
        }
    }
    
    // Device management
    activateDevice(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (device) {
            // Deactivate all other devices
            this.connectedDevices.forEach(d => d.isActive = false);
            
            // Activate selected device
            device.isActive = true;
            console.log(`Activated MIDI device: ${device.name}`);
            
            return true;
        }
        return false;
    }
    
    deactivateAllDevices() {
        this.connectedDevices.forEach(device => device.isActive = false);
    }
    
    getConnectedDevices() {
        return Array.from(this.connectedDevices.values()).map(device => ({
            id: device.port.id,
            name: device.name,
            manufacturer: device.manufacturer,
            isActive: device.isActive
        }));
    }
    
    // Set active MIDI device
    setActiveDevice(deviceId) {
        // Deactivate all devices first
        this.connectedDevices.forEach(device => {
            device.isActive = false;
        });
        
        // Activate selected device
        if (deviceId && this.connectedDevices.has(deviceId)) {
            const device = this.connectedDevices.get(deviceId);
            device.isActive = true;
            console.log(`Activated MIDI device: ${device.name}`);
        }
    }

    // Scan for devices that are already connected
    scanExistingDevices() {
        if (!this.midiAccess) return;
        
        // Scan inputs
        for (const input of this.midiAccess.inputs.values()) {
            if (input.state === 'connected') {
                this.addInputDevice(input);
                console.log(`Found existing MIDI input: ${input.name}`);
            }
        }
        
        console.log(`Found ${this.connectedDevices.size} connected MIDI devices`);
    }

    // Update device list in UI
    updateDeviceList() {
        const deviceSelect = document.getElementById('midi-devices');
        if (!deviceSelect) return;
        
        // Clear existing options
        deviceSelect.innerHTML = '<option value="">No MIDI devices</option>';
        
        const devices = this.getConnectedDevices();
        
        if (devices.length === 0) {
            deviceSelect.innerHTML = '<option value="">No MIDI devices connected</option>';
        } else {
            deviceSelect.innerHTML = '<option value="">Select MIDI device</option>';
            
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.textContent = `${device.name} (${device.manufacturer})`;
                if (device.isActive) {
                    option.selected = true;
                }
                deviceSelect.appendChild(option);
            });
        }
        
        // Add event listener for device selection
        deviceSelect.onchange = (e) => {
            if (e.target.value) {
                this.activateDevice(e.target.value);
            } else {
                this.deactivateAllDevices();
            }
        };
    }
    
    // Show MIDI error message
    showMIDIError(message) {
        const deviceSelect = document.getElementById('midi-devices');
        if (deviceSelect) {
            deviceSelect.innerHTML = `<option value="">${message}</option>`;
            deviceSelect.disabled = true;
        }
    }
    
    // Settings
    setVelocityCurve(curve) {
        if (['linear', 'logarithmic', 'exponential'].includes(curve)) {
            this.velocityCurve = curve;
        }
    }
    
    setVelocityScale(scale) {
        this.velocityScale = Math.max(0.1, Math.min(2.0, scale));
    }
    
    // Send MIDI messages (if supported)
    sendNoteOn(note, velocity = 64, channel = 0) {
        if (!this.isEnabled) return;
        
        const activeDevices = Array.from(this.connectedDevices.values())
            .filter(device => device.isActive && device.port.type === 'output');
            
        activeDevices.forEach(device => {
            const message = [0x90 | channel, note, velocity];
            device.port.send(message);
        });
    }
    
    sendNoteOff(note, channel = 0) {
        if (!this.isEnabled) return;
        
        const activeDevices = Array.from(this.connectedDevices.values())
            .filter(device => device.isActive && device.port.type === 'output');
            
        activeDevices.forEach(device => {
            const message = [0x80 | channel, note, 0];
            device.port.send(message);
        });
    }
    
    // Convert MIDI note number to note name
    midiToNoteName(midiNote) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteIndex = midiNote % 12;
        return notes[noteIndex] + octave;
    }
    
    // Cleanup
    destroy() {
        if (this.midiAccess) {
            this.connectedDevices.forEach(device => {
                device.port.onmidimessage = null;
            });
            this.connectedDevices.clear();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MIDIHandler;
} else {
    window.MIDIHandler = MIDIHandler;
}
