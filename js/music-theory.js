// Music Theory Constants and Utilities

// Note names and their MIDI numbers (starting from C4 = 60)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_FREQUENCIES = {
    'C': [65.41, 130.81, 261.63, 523.25, 1046.50, 2093.00, 4186.01],
    'C#': [69.30, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92],
    'D': [73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.63],
    'D#': [77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03],
    'E': [82.41, 164.81, 329.63, 659.25, 1318.51, 2637.02, 5274.04],
    'F': [87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83, 5587.65],
    'F#': [92.50, 185.00, 369.99, 739.99, 1479.98, 2959.96, 5919.91],
    'G': [98.00, 196.00, 392.00, 783.99, 1567.98, 3135.96, 6271.93],
    'G#': [103.83, 207.65, 415.30, 830.61, 1661.22, 3322.44, 6644.88],
    'A': [110.00, 220.00, 440.00, 880.00, 1760.00, 3520.00, 7040.00],
    'A#': [116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31, 7458.62],
    'B': [123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07, 7902.13]
};

// Scale definitions (intervals from root note)
const SCALES = {
    major: {
        name: 'Major',
        intervals: [0, 2, 4, 5, 7, 9, 11],
        formula: 'W-W-H-W-W-W-H'
    },
    minor: {
        name: 'Natural Minor',
        intervals: [0, 2, 3, 5, 7, 8, 10],
        formula: 'W-H-W-W-H-W-W'
    },
    pentatonic: {
        name: 'Major Pentatonic',
        intervals: [0, 2, 4, 7, 9],
        formula: 'W-W-3H-W-3H'
    },
    blues: {
        name: 'Blues Scale',
        intervals: [0, 3, 5, 6, 7, 10],
        formula: '3H-W-H-H-3H-W'
    },
    dorian: {
        name: 'Dorian',
        intervals: [0, 2, 3, 5, 7, 9, 10],
        formula: 'W-H-W-W-W-H-W'
    },
    mixolydian: {
        name: 'Mixolydian',
        intervals: [0, 2, 4, 5, 7, 9, 10],
        formula: 'W-W-H-W-W-H-W'
    },
    phrygian: {
        name: 'Phrygian',
        intervals: [0, 1, 3, 5, 7, 8, 10],
        formula: 'H-W-W-W-H-W-W'
    },
    lydian: {
        name: 'Lydian',
        intervals: [0, 2, 4, 6, 7, 9, 11],
        formula: 'W-W-W-H-W-W-H'
    },
    locrian: {
        name: 'Locrian',
        intervals: [0, 1, 3, 5, 6, 8, 10],
        formula: 'H-W-W-H-W-W-W'
    },
    harmonicMinor: {
        name: 'Harmonic Minor',
        intervals: [0, 2, 3, 5, 7, 8, 11],
        formula: 'W-H-W-W-H-3H-H'
    },
    melodicMinor: {
        name: 'Melodic Minor',
        intervals: [0, 2, 3, 5, 7, 9, 11],
        formula: 'W-H-W-W-W-W-H'
    }
};

// Chord definitions
const CHORD_TYPES = {
    // Triads
    triads: {
        '': { name: 'Major', intervals: [0, 4, 7], symbol: '' },
        'm': { name: 'Minor', intervals: [0, 3, 7], symbol: 'm' },
        'dim': { name: 'Diminished', intervals: [0, 3, 6], symbol: '°' },
        'aug': { name: 'Augmented', intervals: [0, 4, 8], symbol: '+' },
        'sus2': { name: 'Suspended 2nd', intervals: [0, 2, 7], symbol: 'sus2' },
        'sus4': { name: 'Suspended 4th', intervals: [0, 5, 7], symbol: 'sus4' }
    },
    
    // Seventh chords
    sevenths: {
        'maj7': { name: 'Major 7th', intervals: [0, 4, 7, 11], symbol: 'maj7' },
        'm7': { name: 'Minor 7th', intervals: [0, 3, 7, 10], symbol: 'm7' },
        '7': { name: 'Dominant 7th', intervals: [0, 4, 7, 10], symbol: '7' },
        'dim7': { name: 'Diminished 7th', intervals: [0, 3, 6, 9], symbol: '°7' },
        'm7b5': { name: 'Half Diminished', intervals: [0, 3, 6, 10], symbol: 'ø7' },
        'mMaj7': { name: 'Minor Major 7th', intervals: [0, 3, 7, 11], symbol: 'm(maj7)' },
        'aug7': { name: 'Augmented 7th', intervals: [0, 4, 8, 10], symbol: '+7' }
    },
    
    // Extended chords
    extended: {
        '9': { name: 'Dominant 9th', intervals: [0, 4, 7, 10, 14], symbol: '9' },
        'maj9': { name: 'Major 9th', intervals: [0, 4, 7, 11, 14], symbol: 'maj9' },
        'm9': { name: 'Minor 9th', intervals: [0, 3, 7, 10, 14], symbol: 'm9' },
        '11': { name: 'Dominant 11th', intervals: [0, 4, 7, 10, 14, 17], symbol: '11' },
        '13': { name: 'Dominant 13th', intervals: [0, 4, 7, 10, 14, 21], symbol: '13' },
        '6': { name: 'Major 6th', intervals: [0, 4, 7, 9], symbol: '6' },
        'm6': { name: 'Minor 6th', intervals: [0, 3, 7, 9], symbol: 'm6' }
    },
    
    // Sus chords (extended)
    sus: {
        'sus2': { name: 'Suspended 2nd', intervals: [0, 2, 7], symbol: 'sus2' },
        'sus4': { name: 'Suspended 4th', intervals: [0, 5, 7], symbol: 'sus4' },
        '7sus2': { name: '7th Suspended 2nd', intervals: [0, 2, 7, 10], symbol: '7sus2' },
        '7sus4': { name: '7th Suspended 4th', intervals: [0, 5, 7, 10], symbol: '7sus4' },
        '9sus4': { name: '9th Suspended 4th', intervals: [0, 5, 7, 10, 14], symbol: '9sus4' }
    }
};

// Music Theory Utility Functions
class MusicTheory {
    // Convert note name to MIDI number
    static noteToMidi(note, octave = 4) {
        const noteIndex = NOTES.indexOf(note);
        if (noteIndex === -1) return null;
        return (octave + 1) * 12 + noteIndex;
    }
    
    // Convert MIDI number to note name and octave
    static midiToNote(midiNumber) {
        const octave = Math.floor(midiNumber / 12) - 1;
        const noteIndex = midiNumber % 12;
        return {
            note: NOTES[noteIndex],
            octave: octave,
            fullName: NOTES[noteIndex] + octave
        };
    }
    
    // Get frequency for a MIDI note
    static midiToFrequency(midiNumber) {
        return 440 * Math.pow(2, (midiNumber - 69) / 12);
    }
    
    // Get notes in a scale
    static getScaleNotes(rootNote, scaleType) {
        if (!SCALES[scaleType]) return [];
        
        const rootIndex = NOTES.indexOf(rootNote);
        if (rootIndex === -1) return [];
        
        const scale = SCALES[scaleType];
        return scale.intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            return NOTES[noteIndex];
        });
    }
    
    // Get chord notes
    static getChordNotes(rootNote, chordType, category = 'triads') {
        const chordCategory = CHORD_TYPES[category];
        if (!chordCategory || !chordCategory[chordType]) return [];
        
        const rootIndex = NOTES.indexOf(rootNote);
        if (rootIndex === -1) return [];
        
        const chord = chordCategory[chordType];
        return chord.intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            return NOTES[noteIndex];
        });
    }
    
    // Detect chord from pressed notes
    static detectChord(pressedNotes) {
        if (pressedNotes.length < 2) return null;
        
        // Sort notes and find all possible root notes
        const sortedNotes = [...pressedNotes].sort();
        const results = [];
        
        for (const rootNote of sortedNotes) {
            const rootIndex = NOTES.indexOf(rootNote);
            
            // Calculate intervals from root
            const intervals = pressedNotes.map(note => {
                const noteIndex = NOTES.indexOf(note);
                let interval = (noteIndex - rootIndex + 12) % 12;
                return interval;
            }).sort((a, b) => a - b);
            
            // Check against known chord types
            for (const [category, chords] of Object.entries(CHORD_TYPES)) {
                for (const [chordType, chordDef] of Object.entries(chords)) {
                    const chordIntervals = [...chordDef.intervals].sort((a, b) => a - b);
                    
                    // Check if intervals match (allowing for extended chords)
                    if (this.intervalsMatch(intervals, chordIntervals)) {
                        results.push({
                            root: rootNote,
                            type: chordType,
                            category: category,
                            name: rootNote + chordDef.symbol,
                            fullName: rootNote + ' ' + chordDef.name,
                            notes: pressedNotes,
                            quality: this.getChordQuality(chordType, category)
                        });
                    }
                }
            }
        }
        
        // Return the most likely chord (prefer simpler chords)
        if (results.length > 0) {
            return results.sort((a, b) => {
                const orderPriority = { triads: 0, sevenths: 1, sus: 2, extended: 3 };
                return orderPriority[a.category] - orderPriority[b.category];
            })[0];
        }
        
        return null;
    }
    
    // Helper function to check if intervals match
    static intervalsMatch(intervals1, intervals2) {
        if (intervals1.length < intervals2.length) return false;
        
        // Check if intervals2 is a subset of intervals1
        return intervals2.every(interval => intervals1.includes(interval));
    }
    
    // Get chord quality for color coding
    static getChordQuality(chordType, category) {
        if (category === 'triads') {
            if (chordType === '' || chordType === 'sus2' || chordType === 'sus4') return 'major';
            if (chordType === 'm') return 'minor';
            if (chordType === 'dim') return 'diminished';
            if (chordType === 'aug') return 'augmented';
        }
        
        if (category === 'sevenths') {
            if (chordType.includes('maj')) return 'major';
            if (chordType.includes('m') || chordType.includes('dim')) return 'minor';
            if (chordType === '7') return 'dominant';
        }
        
        return 'extended';
    }
    
    // Get interval name
    static getIntervalName(semitones) {
        const intervals = {
            0: 'Unison',
            1: 'Minor 2nd',
            2: 'Major 2nd',
            3: 'Minor 3rd',
            4: 'Major 3rd',
            5: 'Perfect 4th',
            6: 'Tritone',
            7: 'Perfect 5th',
            8: 'Minor 6th',
            9: 'Major 6th',
            10: 'Minor 7th',
            11: 'Major 7th',
            12: 'Octave'
        };
        return intervals[semitones % 12] || 'Unknown';
    }
    
    // Get all chords for a category
    static getChordsForCategory(category) {
        return CHORD_TYPES[category] || {};
    }
    
    // Get scale formula
    static getScaleFormula(scaleType) {
        return SCALES[scaleType]?.formula || '';
    }
    
    // Transpose a note by semitones
    static transposeNote(note, semitones) {
        const noteIndex = NOTES.indexOf(note);
        if (noteIndex === -1) return note;
        
        const newIndex = (noteIndex + semitones + 12) % 12;
        return NOTES[newIndex];
    }
    
    // Get enharmonic equivalent
    static getEnharmonic(note) {
        const enharmonics = {
            'C#': 'Db', 'Db': 'C#',
            'D#': 'Eb', 'Eb': 'D#',
            'F#': 'Gb', 'Gb': 'F#',
            'G#': 'Ab', 'Ab': 'G#',
            'A#': 'Bb', 'Bb': 'A#'
        };
        return enharmonics[note] || note;
    }
    
    // Check if note is in scale
    static isNoteInScale(note, rootNote, scaleType) {
        const scaleNotes = this.getScaleNotes(rootNote, scaleType);
        return scaleNotes.includes(note);
    }
    
    // Get chord progressions in a key
    static getChordProgressions(key, scaleType = 'major') {
        const scaleNotes = this.getScaleNotes(key, scaleType);
        const progressions = [];
        
        if (scaleType === 'major') {
            // Common progressions in major keys
            progressions.push({
                name: 'I-V-vi-IV',
                chords: [
                    { root: scaleNotes[0], type: '' },
                    { root: scaleNotes[4], type: '' },
                    { root: scaleNotes[5], type: 'm' },
                    { root: scaleNotes[3], type: '' }
                ]
            });
            
            progressions.push({
                name: 'ii-V-I',
                chords: [
                    { root: scaleNotes[1], type: 'm' },
                    { root: scaleNotes[4], type: '' },
                    { root: scaleNotes[0], type: '' }
                ]
            });
        }
        
        return progressions;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MusicTheory, NOTES, SCALES, CHORD_TYPES };
} else {
    window.MusicTheory = MusicTheory;
    window.NOTES = NOTES;
    window.SCALES = SCALES;
    window.CHORD_TYPES = CHORD_TYPES;
}
