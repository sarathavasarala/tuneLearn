// Chord Detection and Analysis Module

class ChordDetector {
    constructor() {
        this.currentChord = null;
        this.chordHistory = [];
        this.maxHistoryLength = 10;
        
        // Chord detection settings
        this.settings = {
            minNotes: 2,
            maxNotes: 6,
            ignoreDuplicates: true,
            includeInversions: true,
            preferSimpleChords: true
        };
        
        // Chord quality colors for visualization
        this.chordColors = {
            major: '#4caf50',
            minor: '#2196f3',
            diminished: '#ff5722',
            augmented: '#ff9800',
            dominant: '#9c27b0',
            suspended: '#607d8b',
            extended: '#795548'
        };
    }
    
    // Analyze pressed notes and detect chord
    analyzeChord(pressedNotes) {
        if (!pressedNotes || pressedNotes.length < this.settings.minNotes) {
            this.currentChord = null;
            return null;
        }
        
        // Remove duplicates and sort
        const uniqueNotes = [...new Set(pressedNotes)];
        if (uniqueNotes.length < this.settings.minNotes) {
            this.currentChord = null;
            return null;
        }
        
        // Detect chord
        const chord = this.detectChordFromNotes(uniqueNotes);
        
        if (chord) {
            this.currentChord = chord;
            this.addToHistory(chord);
            return chord;
        }
        
        this.currentChord = null;
        return null;
    }
    
    // Main chord detection logic
    detectChordFromNotes(notes) {
        const results = [];
        
        // Try each note as potential root
        for (const rootNote of notes) {
            const chordCandidates = this.findChordsWithRoot(notes, rootNote);
            results.push(...chordCandidates);
        }
        
        if (results.length === 0) {
            return this.analyzeUnknownChord(notes);
        }
        
        // Sort results by preference
        results.sort(this.compareChords.bind(this));
        
        return results[0];
    }
    
    // Find all possible chords with a given root note
    findChordsWithRoot(notes, rootNote) {
        const results = [];
        const rootIndex = NOTES.indexOf(rootNote);
        
        if (rootIndex === -1) return results;
        
        // Calculate intervals from root
        const intervals = notes.map(note => {
            const noteIndex = NOTES.indexOf(note);
            return (noteIndex - rootIndex + 12) % 12;
        }).sort((a, b) => a - b);
        
        // Check against all chord types
        for (const [category, chords] of Object.entries(CHORD_TYPES)) {
            for (const [chordType, chordDef] of Object.entries(chords)) {
                const match = this.matchChordPattern(intervals, chordDef.intervals);
                
                if (match.isMatch) {
                    results.push({
                        root: rootNote,
                        type: chordType,
                        category: category,
                        symbol: chordDef.symbol,
                        name: rootNote + chordDef.symbol,
                        fullName: rootNote + ' ' + chordDef.name,
                        notes: notes,
                        intervals: intervals,
                        quality: MusicTheory.getChordQuality(chordType, category),
                        confidence: match.confidence,
                        inversion: match.inversion,
                        missingNotes: match.missingNotes,
                        extraNotes: match.extraNotes
                    });
                }
            }
        }
        
        return results;
    }
    
    // Match chord pattern against intervals
    matchChordPattern(playedIntervals, chordIntervals) {
        const result = {
            isMatch: false,
            confidence: 0,
            inversion: 0,
            missingNotes: [],
            extraNotes: []
        };
        
        // Check for exact match
        if (this.arraysEqual(playedIntervals, chordIntervals)) {
            result.isMatch = true;
            result.confidence = 1.0;
            return result;
        }
        
        // Check if chord intervals are subset of played intervals
        const containsAllChordNotes = chordIntervals.every(interval => 
            playedIntervals.includes(interval)
        );
        
        if (containsAllChordNotes) {
            result.isMatch = true;
            result.confidence = 0.9;
            result.extraNotes = playedIntervals.filter(interval => 
                !chordIntervals.includes(interval)
            );
            return result;
        }
        
        // Check for inversions if enabled
        if (this.settings.includeInversions) {
            const inversionMatch = this.checkInversions(playedIntervals, chordIntervals);
            if (inversionMatch.isMatch) {
                return inversionMatch;
            }
        }
        
        // Check for partial matches (missing notes)
        const matchedNotes = chordIntervals.filter(interval => 
            playedIntervals.includes(interval)
        );
        
        if (matchedNotes.length >= Math.min(2, chordIntervals.length - 1)) {
            result.isMatch = true;
            result.confidence = matchedNotes.length / chordIntervals.length;
            result.missingNotes = chordIntervals.filter(interval => 
                !playedIntervals.includes(interval)
            );
            result.extraNotes = playedIntervals.filter(interval => 
                !chordIntervals.includes(interval)
            );
        }
        
        return result;
    }
    
    // Check for chord inversions
    checkInversions(playedIntervals, chordIntervals) {
        const result = {
            isMatch: false,
            confidence: 0,
            inversion: 0,
            missingNotes: [],
            extraNotes: []
        };
        
        // Try different inversions
        for (let inversion = 1; inversion < chordIntervals.length; inversion++) {
            const invertedIntervals = this.getInversion(chordIntervals, inversion);
            
            if (this.arraysEqual(playedIntervals, invertedIntervals)) {
                result.isMatch = true;
                result.confidence = 0.85; // Slightly lower than root position
                result.inversion = inversion;
                return result;
            }
            
            // Check subset match for inversions
            const containsAllInvertedNotes = invertedIntervals.every(interval => 
                playedIntervals.includes(interval)
            );
            
            if (containsAllInvertedNotes && playedIntervals.length <= invertedIntervals.length + 2) {
                result.isMatch = true;
                result.confidence = 0.75;
                result.inversion = inversion;
                result.extraNotes = playedIntervals.filter(interval => 
                    !invertedIntervals.includes(interval)
                );
                return result;
            }
        }
        
        return result;
    }
    
    // Get chord inversion intervals
    getInversion(intervals, inversion) {
        const inverted = [...intervals];
        
        for (let i = 0; i < inversion; i++) {
            const note = inverted.shift();
            inverted.push(note + 12);
        }
        
        // Normalize back to within octave
        return inverted.map(interval => interval % 12).sort((a, b) => a - b);
    }
    
    // Compare chords for sorting preference
    compareChords(a, b) {
        // Prefer higher confidence
        if (a.confidence !== b.confidence) {
            return b.confidence - a.confidence;
        }
        
        // Prefer root position over inversions
        if (a.inversion !== b.inversion) {
            return a.inversion - b.inversion;
        }
        
        // Prefer simpler chords if setting is enabled
        if (this.settings.preferSimpleChords) {
            const categoryOrder = { triads: 0, sevenths: 1, sus: 2, extended: 3 };
            const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
            if (categoryDiff !== 0) {
                return categoryDiff;
            }
        }
        
        // Prefer fewer extra notes
        const extraNotesDiff = a.extraNotes.length - b.extraNotes.length;
        if (extraNotesDiff !== 0) {
            return extraNotesDiff;
        }
        
        // Prefer fewer missing notes
        return a.missingNotes.length - b.missingNotes.length;
    }
    
    // Analyze unknown chord patterns
    analyzeUnknownChord(notes) {
        if (notes.length < 2) return null;
        
        // Calculate intervals
        const rootNote = notes[0]; // Use first note as root
        const rootIndex = NOTES.indexOf(rootNote);
        const intervals = notes.map(note => {
            const noteIndex = NOTES.indexOf(note);
            return (noteIndex - rootIndex + 12) % 12;
        }).sort((a, b) => a - b);
        
        // Analyze interval structure
        const analysis = this.analyzeIntervalStructure(intervals);
        
        return {
            root: rootNote,
            type: 'unknown',
            category: 'unknown',
            symbol: '?',
            name: rootNote + '?',
            fullName: rootNote + ' Unknown Chord',
            notes: notes,
            intervals: intervals,
            quality: 'unknown',
            confidence: 0.5,
            inversion: 0,
            missingNotes: [],
            extraNotes: [],
            analysis: analysis
        };
    }
    
    // Analyze interval structure for unknown chords
    analyzeIntervalStructure(intervals) {
        const analysis = {
            hasThird: intervals.includes(3) || intervals.includes(4),
            hasFifth: intervals.includes(7),
            hasSeventh: intervals.includes(10) || intervals.includes(11),
            hasNinth: intervals.includes(2) || intervals.includes(14),
            hasEleventh: intervals.includes(5) || intervals.includes(17),
            hasThirteenth: intervals.includes(9) || intervals.includes(21),
            intervalNames: intervals.map(interval => MusicTheory.getIntervalName(interval))
        };
        
        // Determine basic characteristics
        if (analysis.hasThird) {
            analysis.quality = intervals.includes(4) ? 'major' : 'minor';
        } else {
            analysis.quality = 'suspended';
        }
        
        analysis.extensions = [];
        if (analysis.hasSeventh) analysis.extensions.push('7th');
        if (analysis.hasNinth) analysis.extensions.push('9th');
        if (analysis.hasEleventh) analysis.extensions.push('11th');
        if (analysis.hasThirteenth) analysis.extensions.push('13th');
        
        return analysis;
    }
    
    // Utility methods
    arraysEqual(a, b) {
        return a.length === b.length && a.every((val, i) => val === b[i]);
    }
    
    // Add chord to history
    addToHistory(chord) {
        // Don't add duplicates
        if (this.chordHistory.length > 0 && 
            this.chordHistory[this.chordHistory.length - 1].name === chord.name) {
            return;
        }
        
        this.chordHistory.push({
            ...chord,
            timestamp: Date.now()
        });
        
        // Keep history within limit
        if (this.chordHistory.length > this.maxHistoryLength) {
            this.chordHistory.shift();
        }
    }
    
    // Get chord suggestions based on current chord
    getChordSuggestions(currentChord, key = 'C', scaleType = 'major') {
        if (!currentChord) return [];
        
        const suggestions = [];
        const scaleNotes = MusicTheory.getScaleNotes(key, scaleType);
        
        // Common chord progressions
        const progressions = {
            'I': ['ii', 'iii', 'IV', 'V', 'vi'],
            'ii': ['V', 'vii°'],
            'iii': ['vi', 'IV'],
            'IV': ['I', 'V', 'ii'],
            'V': ['I', 'vi'],
            'vi': ['IV', 'ii', 'V'],
            'vii°': ['I']
        };
        
        // Find current chord's function in the key
        const chordFunction = this.getChordFunction(currentChord, key, scaleType);
        
        if (chordFunction && progressions[chordFunction]) {
            progressions[chordFunction].forEach(nextFunction => {
                const chordNote = this.getFunctionChord(nextFunction, key, scaleType);
                if (chordNote) {
                    suggestions.push(chordNote);
                }
            });
        }
        
        return suggestions;
    }
    
    // Get chord function in a key (I, ii, iii, etc.)
    getChordFunction(chord, key, scaleType) {
        const scaleNotes = MusicTheory.getScaleNotes(key, scaleType);
        const chordIndex = scaleNotes.indexOf(chord.root);
        
        if (chordIndex === -1) return null;
        
        const functions = scaleType === 'major' 
            ? ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
            : ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
            
        return functions[chordIndex];
    }
    
    // Get chord for a given function
    getFunctionChord(functionSymbol, key, scaleType) {
        const scaleNotes = MusicTheory.getScaleNotes(key, scaleType);
        const functions = scaleType === 'major' 
            ? ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
            : ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
            
        const functionIndex = functions.indexOf(functionSymbol);
        if (functionIndex === -1) return null;
        
        const root = scaleNotes[functionIndex];
        const isMinor = functionSymbol.toLowerCase() === functionSymbol;
        const isDiminished = functionSymbol.includes('°');
        
        let chordType = '';
        if (isDiminished) chordType = 'dim';
        else if (isMinor) chordType = 'm';
        
        return {
            root: root,
            type: chordType,
            name: root + chordType,
            function: functionSymbol
        };
    }
    
    // Get chord color based on quality
    getChordColor(chord) {
        if (!chord) return '#666666';
        
        return this.chordColors[chord.quality] || '#666666';
    }
    
    // Get current chord info
    getCurrentChord() {
        return this.currentChord;
    }
    
    // Get chord history
    getHistory() {
        return [...this.chordHistory];
    }
    
    // Clear history
    clearHistory() {
        this.chordHistory = [];
    }
    
    // Settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
    
    // Get chord statistics
    getStatistics() {
        if (this.chordHistory.length === 0) {
            return {
                totalChords: 0,
                uniqueChords: 0,
                mostCommon: null,
                averageConfidence: 0
            };
        }
        
        const uniqueChords = new Set(this.chordHistory.map(c => c.name));
        const chordCounts = {};
        let totalConfidence = 0;
        
        this.chordHistory.forEach(chord => {
            chordCounts[chord.name] = (chordCounts[chord.name] || 0) + 1;
            totalConfidence += chord.confidence;
        });
        
        const mostCommon = Object.entries(chordCounts)
            .sort(([,a], [,b]) => b - a)[0];
        
        return {
            totalChords: this.chordHistory.length,
            uniqueChords: uniqueChords.size,
            mostCommon: mostCommon ? { name: mostCommon[0], count: mostCommon[1] } : null,
            averageConfidence: totalConfidence / this.chordHistory.length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChordDetector;
} else {
    window.ChordDetector = ChordDetector;
}
