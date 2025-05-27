// Piano Keyboard Visual Component

class PianoKeyboard {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        
        // Keyboard configuration
        this.config = {
            startNote: options.startNote || 'C3',
            endNote: options.endNote || 'C6',
            showLabels: options.showLabels || true,
            highlightScale: null,
            rootNote: 'C',
            scaleType: null,
            scaleLock: false
        };
        
        // Parse octave numbers from start and end notes
        this.config.startOctave = parseInt(this.config.startNote.slice(-1));
        this.config.endOctave = parseInt(this.config.endNote.slice(-1));
        this.config.startNoteName = this.config.startNote.slice(0, -1);
        this.config.endNoteName = this.config.endNote.slice(0, -1);
        
        // Callbacks
        this.onNoteOn = options.onNoteOn || (() => {});
        this.onNoteOff = options.onNoteOff || (() => {});
        
        // Key states
        this.pressedKeys = new Set();
        this.sustainedKeys = new Set();
        this.scaleNotes = new Set();
        this.lockedNotes = new Set();
        
        // Computer keyboard mapping
        this.computerKeyMapping = {
            // Row 1: Numbers (C4-B4)
            '1': { note: 'C', octave: 4 },
            '!': { note: 'C#', octave: 4 },
            '2': { note: 'D', octave: 4 },
            '@': { note: 'D#', octave: 4 },
            '3': { note: 'E', octave: 4 },
            '4': { note: 'F', octave: 4 },
            '$': { note: 'F#', octave: 4 },
            '5': { note: 'G', octave: 4 },
            '%': { note: 'G#', octave: 4 },
            '6': { note: 'A', octave: 4 },
            '^': { note: 'A#', octave: 4 },
            '7': { note: 'B', octave: 4 },
            
            // Row 2: QWERTY (C5-B5)
            'q': { note: 'C', octave: 5 },
            'Q': { note: 'C#', octave: 5 },
            'w': { note: 'D', octave: 5 },
            'W': { note: 'D#', octave: 5 },
            'e': { note: 'E', octave: 5 },
            'r': { note: 'F', octave: 5 },
            'R': { note: 'F#', octave: 5 },
            't': { note: 'G', octave: 5 },
            'T': { note: 'G#', octave: 5 },
            'y': { note: 'A', octave: 5 },
            'Y': { note: 'A#', octave: 5 },
            'u': { note: 'B', octave: 5 }
        };
        
        this.activeComputerKeys = new Set();
        
        this.keys = {}; // Initialize the keys map
        
        this.init();
    }
    
    init() {
        this.generateKeyboard();
        this.setupEventListeners();
        this.setupComputerKeyboard();
    }
    
    // Generate the visual keyboard
    generateKeyboard() {
        if (!this.container) {
            console.error('Piano keyboard container not found');
            return;
        }
        
        this.container.innerHTML = '';
        this.keys = {}; // Clear and reinitialize the keys map on regeneration
        
        const keyboardElement = document.createElement('div');
        keyboardElement.className = 'piano-keys';
        
        // Calculate total white keys for container width
        let totalWhiteKeys = 0;
        for (let octave = this.config.startOctave; octave <= this.config.endOctave; octave++) {
            const startNote = octave === this.config.startOctave ? this.config.startNoteName : 'C';
            const endNote = octave === this.config.endOctave ? this.config.endNoteName : 'B';
            
            const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            const startIdx = whiteNotes.indexOf(startNote.replace('#', ''));
            const endIdx = whiteNotes.indexOf(endNote.replace('#', ''));
            
            if (octave === this.config.startOctave && octave === this.config.endOctave) {
                totalWhiteKeys += Math.max(0, endIdx - startIdx + 1);
            } else if (octave === this.config.startOctave) {
                totalWhiteKeys += whiteNotes.length - startIdx;
            } else if (octave === this.config.endOctave) {
                totalWhiteKeys += endIdx + 1;
            } else {
                totalWhiteKeys += whiteNotes.length;
            }
        }
        
        // Set container width
        const whiteKeyWidth = 49;
        keyboardElement.style.width = `${totalWhiteKeys * whiteKeyWidth}px`;
        
        // Generate keys for the specified range
        for (let octave = this.config.startOctave; octave <= this.config.endOctave; octave++) {
            const startNote = octave === this.config.startOctave ? this.config.startNoteName : 'C';
            const endNote = octave === this.config.endOctave ? this.config.endNoteName : 'B';
            
            this.generateOctaveKeys(keyboardElement, octave, startNote, endNote);
        }
        
        this.container.appendChild(keyboardElement);
        this.updateScaleHighlighting();
    }
    
    // Generate keys for one octave
    generateOctaveKeys(container, octave, startNote = 'C', endNote = 'B') {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const startIndex = notes.indexOf(startNote);
        const endIndex = notes.indexOf(endNote);
        
        // Create white keys first
        for (let i = startIndex; i <= endIndex; i++) {
            const note = notes[i];
            if (!note.includes('#')) {
                this.createKey(note, octave, 'white', container);
            }
        }
        
        // Create black keys and position them
        for (let i = startIndex; i <= endIndex; i++) {
            const note = notes[i];
            if (note.includes('#')) {
                this.createKey(note, octave, 'black', container);
            }
        }
    }
    
    // Create individual piano key
    createKey(note, octave, keyType, container) {
        const keyElement = document.createElement('div');
        const keyId = `key-${note}-${octave}`;
        const fullNote = `${note}${octave}`;
        
        keyElement.id = keyId;
        keyElement.className = `piano-key ${keyType}`;
        keyElement.dataset.note = fullNote;
        keyElement.dataset.noteClass = note; // Just the note without octave
        keyElement.dataset.octave = octave;
        keyElement.dataset.keyType = keyType;
        
        // Position keys
        if (keyType === 'black') {
            const position = this.getBlackKeyPosition(note, octave);
            keyElement.style.left = `${position}px`;
        } else {
            const position = this.getWhiteKeyPosition(note, octave);
            keyElement.style.left = `${position}px`;
        }
        
        // Add note label if enabled
        if (this.config.showLabels) {
            const label = document.createElement('span');
            label.className = 'key-label';
            label.textContent = note;
            keyElement.appendChild(label);
        }
        
        // Add click event listener
        keyElement.addEventListener('mousedown', (e) => this.handleKeyDown(e));
        keyElement.addEventListener('mouseup', (e) => this.handleKeyUp(e));
        keyElement.addEventListener('mouseleave', (e) => this.handleKeyUp(e));
        
        container.appendChild(keyElement);
        this.keys[fullNote] = keyElement; // Populate the keys map
    }
    
    // Calculate position for black keys
    getBlackKeyPosition(note, octave) {
        const whiteKeyWidth = 49; // 48px + 1px margin
        const blackKeyWidth = 32;
        
        // Find the white key before this black key
        const whiteKeysInOctave = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        let whiteKeyIndex = 0;
        
        switch (note) {
            case 'C#': whiteKeyIndex = 0; break; // After C
            case 'D#': whiteKeyIndex = 1; break; // After D
            case 'F#': whiteKeyIndex = 3; break; // After F
            case 'G#': whiteKeyIndex = 4; break; // After G
            case 'A#': whiteKeyIndex = 5; break; // After A
        }
        
        // Calculate total white keys before this octave
        const octavesBefore = octave - this.config.startOctave;
        const whiteKeysPerOctave = 7;
        const totalWhiteKeysBefore = octavesBefore * whiteKeysPerOctave + whiteKeyIndex;
        
        return totalWhiteKeysBefore * whiteKeyWidth + (whiteKeyWidth - blackKeyWidth / 2);
    }

    getWhiteKeyPosition(note, octave) {
        const whiteKeyWidth = 49; // 48px + 1px margin
        const whiteKeysInOctave = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const noteIndex = whiteKeysInOctave.indexOf(note);
        
        // Calculate total white keys before this note
        const octavesBefore = octave - this.config.startOctave;
        const whiteKeysPerOctave = 7;
        const totalWhiteKeysBefore = octavesBefore * whiteKeysPerOctave + noteIndex;
        
        return totalWhiteKeysBefore * whiteKeyWidth;
    }

    // Setup mouse and touch event listeners
    setupEventListeners() {
        this.container.addEventListener('mousedown', this.handleKeyPress.bind(this));
        this.container.addEventListener('mouseup', this.handleKeyRelease.bind(this));
        this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Touch events for mobile
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.container.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
        
        // Prevent context menu on right click
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    // Setup computer keyboard event listeners
    setupComputerKeyboard() {
        document.addEventListener('keydown', this.handleComputerKeyDown.bind(this));
        document.addEventListener('keyup', this.handleComputerKeyUp.bind(this));
        
        // Prevent default behavior for mapped keys
        document.addEventListener('keydown', (e) => {
            if (this.computerKeyMapping[e.key]) {
                e.preventDefault();
            }
        });
    }
    
    // Handle mouse key press
    handleKeyPress(event) {
        if (event.target.classList.contains('piano-key')) {
            const note = event.target.dataset.note;
            const octave = parseInt(event.target.dataset.octave);
            
            this.pressKey(note, octave);
            event.preventDefault();
        }
    }
    
    // Handle mouse key release
    handleKeyRelease(event) {
        if (event.target.classList.contains('piano-key')) {
            const note = event.target.dataset.note;
            const octave = parseInt(event.target.dataset.octave);
            
            this.releaseKey(note, octave);
            event.preventDefault();
        }
    }
    
    // Handle mouse leaving the keyboard area
    handleMouseLeave(event) {
        // Release all keys when mouse leaves the keyboard
        this.releaseAllKeys();
    }
    
    // Handle touch start
    handleTouchStart(event) {
        event.preventDefault();
        
        Array.from(event.changedTouches).forEach(touch => {
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.classList.contains('piano-key')) {
                const note = element.dataset.note;
                const octave = parseInt(element.dataset.octave);
                this.pressKey(note, octave);
            }
        });
    }
    
    // Handle touch end
    handleTouchEnd(event) {
        event.preventDefault();
        
        Array.from(event.changedTouches).forEach(touch => {
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.classList.contains('piano-key')) {
                const note = element.dataset.note;
                const octave = parseInt(element.dataset.octave);
                this.releaseKey(note, octave);
            }
        });
    }
    
    // Handle computer keyboard key down
    handleComputerKeyDown(event) {
        if (this.activeComputerKeys.has(event.key)) return; // Prevent key repeat
        
        const mapping = this.computerKeyMapping[event.key];
        if (mapping) {
            this.activeComputerKeys.add(event.key);
            this.pressKey(mapping.note, mapping.octave);
            event.preventDefault();
        }
    }
    
    // Handle computer keyboard key up
    handleComputerKeyUp(event) {
        const mapping = this.computerKeyMapping[event.key];
        if (mapping) {
            this.activeComputerKeys.delete(event.key);
            this.releaseKey(mapping.note, mapping.octave);
            event.preventDefault();
        }
    }
    
    // Handle key press (mouse)
    handleKeyDown(event) {
        const keyElement = event.target.closest('.piano-key');
        if (!keyElement || keyElement.classList.contains('pressed')) return;
        
        const note = keyElement.dataset.note;
        const noteClass = keyElement.dataset.noteClass;
        
        // Check scale lock
        if (this.config.scaleLock && !this.lockedNotes.has(noteClass)) {
            return; // Ignore locked notes
        }
        
        keyElement.classList.add('pressed');
        this.pressedKeys.add(note);
        
        // Call callback
        this.onNoteOn(note, 0.8);
    }
    
    // Handle key release (mouse)
    handleKeyUp(event) {
        const keyElement = event.target.closest('.piano-key');
        if (!keyElement) return;
        
        const note = keyElement.dataset.note;
        
        keyElement.classList.remove('pressed');
        this.pressedKeys.delete(note);
        
        // Call callback
        this.onNoteOff(note);
    }

    // Press a key (visual and audio)
    pressKey(note, octave, skipAudio = false) {
        const keyId = `key-${note}-${octave}`;
        const keyElement = document.getElementById(keyId);
        
        if (!keyElement) return;
        
        // Check scale lock
        if (this.config.scaleLock && this.config.scaleType) {
            if (!this.isNoteInCurrentScale(note)) {
                return; // Don't play notes outside the scale
            }
        }
        
        const keyKey = `${note}${octave}`;
        
        if (!this.pressedKeys.has(keyKey)) {
            this.pressedKeys.add(keyKey);
            
            // Visual feedback
            keyElement.classList.add('active');
            
            // Audio feedback
            if (!skipAudio && this.audioEngine) {
                this.audioEngine.playNote(note, octave);
            }
            
            // Dispatch custom event
            this.dispatchKeyEvent('keypress', note, octave);
        }
    }
    
    // Release a key
    releaseKey(note, octave) {
        const keyId = `key-${note}-${octave}`;
        const keyElement = document.getElementById(keyId);
        
        if (!keyElement) return;
        
        const keyKey = `${note}${octave}`;
        
        if (this.pressedKeys.has(keyKey)) {
            this.pressedKeys.delete(keyKey);
            
            // Visual feedback
            keyElement.classList.remove('active');
            
            // Audio feedback
            if (this.audioEngine) {
                this.audioEngine.stopNote(keyKey);
            }
            
            // Dispatch custom event
            this.dispatchKeyEvent('keyrelease', note, octave);
        }
    }
    
    // Release all keys
    releaseAllKeys() {
        const keys = [...this.pressedKeys];
        keys.forEach(keyKey => {
            const match = keyKey.match(/([A-G]#?)(\d+)/);
            if (match) {
                this.releaseKey(match[1], parseInt(match[2]));
            }
        });
    }
    
    // Dispatch custom key events
    dispatchKeyEvent(eventType, note, octave) {
        const event = new CustomEvent(eventType, {
            detail: { note, octave, pressedKeys: [...this.pressedKeys] }
        });
        this.container.dispatchEvent(event);
    }
    
    // Update scale highlighting
    updateScaleHighlighting() {
        // Clear existing highlights
        const allKeys = this.container.querySelectorAll('.piano-key');
        allKeys.forEach(key => {
            key.classList.remove('scale-note', 'chord-root', 'chord-note');
        });
        
        if (this.config.scaleType && this.config.rootNote) {
            const scaleNotes = MusicTheory.getScaleNotes(this.config.rootNote, this.config.scaleType);
            
            allKeys.forEach(key => {
                const note = key.dataset.note;
                if (scaleNotes.includes(note)) {
                    key.classList.add('scale-note');
                    
                    // Highlight root note
                    if (note === this.config.rootNote) {
                        key.classList.add('chord-root');
                    }
                }
            });
        }
    }
    
    // Highlight chord notes
    highlightChord(chordNotes, rootNote = null) {
        // Clear existing chord highlights
        const allKeys = this.container.querySelectorAll('.piano-key');
        allKeys.forEach(key => {
            key.classList.remove('chord-root', 'chord-note');
        });
        
        if (chordNotes && chordNotes.length > 0) {
            allKeys.forEach(key => {
                const note = key.dataset.note;
                if (chordNotes.includes(note)) {
                    if (note === rootNote) {
                        key.classList.add('chord-root');
                    } else {
                        key.classList.add('chord-note');
                    }
                }
            });
        }
    }
    
    // Configuration methods
    setOctaveRange(startOctave, endOctave) {
        this.config.startOctave = startOctave;
        this.config.endOctave = endOctave;
        this.generateKeyboard();
    }
    
    setScale(rootNote, scaleType) {
        this.config.rootNote = rootNote;
        this.config.scaleType = scaleType;
        this.updateScaleHighlighting();
    }
    
    setScaleLock(enabled) {
        this.config.scaleLock = enabled;
    }
    
    showLabels(show) {
        this.config.showLabels = show;
        this.generateKeyboard();
    }
    
    // Utility methods
    isNoteInCurrentScale(note) {
        if (!this.config.scaleType || !this.config.rootNote) return true;
        
        const scaleNotes = MusicTheory.getScaleNotes(this.config.rootNote, this.config.scaleType);
        return scaleNotes.includes(note);
    }
    
    getCurrentlyPressedNotes() {
        return [...this.pressedKeys].map(keyKey => {
            const match = keyKey.match(/([A-G]#?)(\d+)/);
            return match ? match[1] : null;
        }).filter(Boolean);
    }
    
    // Parse octave range string (e.g., "C3-C5")
    parseOctaveRange(rangeString) {
        const parts = rangeString.split('-');
        if (parts.length !== 2) return null;
        
        const start = parts[0].match(/([A-G]#?)(\d+)/);
        const end = parts[1].match(/([A-G]#?)(\d+)/);
        
        if (!start || !end) return null;
        
        return {
            startNote: start[1],
            startOctave: parseInt(start[2]),
            endNote: end[1],
            endOctave: parseInt(end[2])
        };
    }
    
    // Apply octave range from string
    applyOctaveRange(rangeString) {
        const range = this.parseOctaveRange(rangeString);
        if (range) {
            this.config.startOctave = range.startOctave;
            this.config.endOctave = range.endOctave;
            this.config.startNote = range.startNote;
            this.config.endNote = range.endNote;
            this.generateKeyboard();
        }
    }
    
    // Get keyboard statistics
    getStats() {
        const totalKeys = this.container.querySelectorAll('.piano-key').length;
        const whiteKeys = this.container.querySelectorAll('.piano-key.white').length;
        const blackKeys = this.container.querySelectorAll('.piano-key.black').length;
        
        return {
            totalKeys,
            whiteKeys,
            blackKeys,
            pressedKeys: this.pressedKeys.size,
            octaveRange: `${this.config.startOctave}-${this.config.endOctave}`,
            scale: this.config.scaleType ? `${this.config.rootNote} ${this.config.scaleType}` : 'None'
        };
    }

    // Method to press a key (called from external sources like MIDI)
    pressKey(note) {
        const keyElement = this.findKeyElement(note);
        if (keyElement && !keyElement.classList.contains('pressed')) {
            keyElement.classList.add('pressed');
            this.pressedKeys.add(note);
        }
    }
    
    // Method to release a key
    releaseKey(note) {
        const keyElement = this.findKeyElement(note);
        if (keyElement) {
            keyElement.classList.remove('pressed');
            this.pressedKeys.delete(note);
        }
    }
    
    // Find key element by note name
    findKeyElement(note) {
        return this.container.querySelector(`[data-note="${note}"]`);
    }
    
    // Highlight scale notes
    highlightScale(scaleNotes) {
        // Clear previous highlights
        this.clearHighlight();
        
        // Store scale notes
        this.scaleNotes = new Set(scaleNotes);
        
        // Apply highlights
        scaleNotes.forEach(noteClass => {
            const keys = this.container.querySelectorAll(`[data-note-class="${noteClass}"]`);
            keys.forEach(key => key.classList.add('scale-highlight'));
        });
    }
    
    // Clear scale highlights
    clearHighlight() {
        const highlightedKeys = this.container.querySelectorAll('.scale-highlight');
        highlightedKeys.forEach(key => key.classList.remove('scale-highlight'));
        this.scaleNotes.clear();
    }
    
    // Set scale lock (restrict playable notes)
    setScaleLock(notes) {
        if (notes) {
            this.lockedNotes = new Set(notes);
            this.config.scaleLock = true;
            
            // Add visual indication
            const allKeys = this.container.querySelectorAll('.piano-key');
            allKeys.forEach(key => {
                const noteClass = key.dataset.noteClass;
                if (!notes.includes(noteClass)) {
                    key.classList.add('locked');
                } else {
                    key.classList.remove('locked');
                }
            });
        } else {
            this.lockedNotes.clear();
            this.config.scaleLock = false;
            
            // Remove lock styling
            const lockedKeys = this.container.querySelectorAll('.locked');
            lockedKeys.forEach(key => key.classList.remove('locked'));
        }
    }

    // Visual Feedback Methods for Exercises
    colorizeKey(noteNameWithOctave, cssClass) {
        const keyElement = this.keys[noteNameWithOctave];
        if (keyElement) {
            keyElement.classList.add(cssClass);
        } else {
            console.warn(`Key element not found for ${noteNameWithOctave} in colorizeKey`);
        }
    }

    decolorizeKey(noteNameWithOctave, cssClass) {
        const keyElement = this.keys[noteNameWithOctave];
        if (keyElement) {
            keyElement.classList.remove(cssClass);
        } else {
            console.warn(`Key element not found for ${noteNameWithOctave} in decolorizeKey`);
        }
    }

    clearAllKeyColorizations() {
        const feedbackClasses = ['user-played-correct', 'user-played-incorrect', 'expected-missed'];
        for (const noteName in this.keys) {
            if (this.keys.hasOwnProperty(noteName)) {
                const keyElement = this.keys[noteName];
                feedbackClasses.forEach(cls => keyElement.classList.remove(cls));
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PianoKeyboard;
} else {
    window.PianoKeyboard = PianoKeyboard;
}
