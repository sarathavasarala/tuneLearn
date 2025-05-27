// js/engines/chord-engine.js
if (typeof window.MusicTheoryEngine === 'undefined') {
    console.error("MusicTheoryEngine base class not loaded.");
}
if (typeof window.MusicTheory === 'undefined') {
    console.error("MusicTheory utility class not loaded.");
}
if (typeof window.CHORD_TYPES === 'undefined') { // CHORD_TYPES is defined in music-theory.js
    console.error("CHORD_TYPES not loaded. Make sure music-theory.js is loaded.");
}

class ChordIdentificationEngine extends MusicTheoryEngine {
    constructor() {
        super('chord-identification');
    }

    generateExercise(options = {}) {
        // Logic from generateChordIdentification in exercise-engine.js
        const chordCategories = options.chordCategoriesPool || ['triads', 'sevenths'];
        const randomCategoryKey = chordCategories[Math.floor(Math.random() * chordCategories.length)];
        const chordsInCategory = CHORD_TYPES[randomCategoryKey]; // e.g., CHORD_TYPES.triads

        const chordSymbols = Object.keys(chordsInCategory);
        const randomSymbol = chordSymbols[Math.floor(Math.random() * chordSymbols.length)];
        const selectedChordDef = chordsInCategory[randomSymbol]; // e.g., { name: 'Major', intervals: [0,4,7], symbol: '' }

        const rootNoteNames = options.rootNoteNamesPool || ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const rootOctaves = options.rootOctavesPool || [3, 4]; 
        const randomRootName = rootNoteNames[Math.floor(Math.random() * rootNoteNames.length)];
        const randomRootOctave = rootOctaves[Math.floor(Math.random() * rootOctaves.length)];
        const rootNoteFull = randomRootName + randomRootOctave;
        
        // Create multiple choice options
        let mcOptions = [selectedChordDef.name]; // e.g., "Major", "Minor 7th"
        const allChordNames = Object.values(CHORD_TYPES.triads).map(c => c.name)
                                .concat(Object.values(CHORD_TYPES.sevenths).map(c => c.name));
        while (mcOptions.length < (options.numOptions || 4)) {
            const randomName = allChordNames[Math.floor(Math.random() * allChordNames.length)];
            if (!mcOptions.includes(randomName)) {
                mcOptions.push(randomName);
            }
        }
        mcOptions.sort(() => Math.random() - 0.5); // Shuffle

        return {
            type: this.getExerciseTypeName(),
            question: options.question || 'What type of chord was played?',
            chordDefinition: selectedChordDef, // Contains name, intervals, symbol
            rootNoteFull: rootNoteFull, // e.g., C4
            correctAnswer: selectedChordDef.name, // e.g., "Major"
            options: mcOptions,
            explanation: `The chord played (from ${rootNoteFull}) was ${randomRootName}${selectedChordDef.symbol} (${selectedChordDef.name}).`,
            theorySnippet: `A ${selectedChordDef.name} chord consists of notes at intervals of ${selectedChordDef.intervals.map(s => MusicTheory.getIntervalName(s, true)).join(', ')} above the root.`,
            audioPlayback: {
                type: 'chord',
                rootName: randomRootName,
                rootOctave: randomRootOctave,
                intervals: selectedChordDef.intervals // Array of semitone intervals
            }
        };
    }

    validateAnswer(userInput, exerciseData) {
        // Logic from validateChordIdentification in exercise-engine.js
        if (!exerciseData || typeof exerciseData.correctAnswer === 'undefined') {
            console.error("Invalid exerciseData for validation", exerciseData);
            return false;
        }
        return userInput.trim().toLowerCase() === exerciseData.correctAnswer.toLowerCase();
    }
}


class ChordBuildingEngine extends MusicTheoryEngine {
    constructor() {
        super('chord-building');
    }

    generateExercise(options = {}) {
        // Logic from generateChordBuilding in exercise-engine.js
        const chordCategories = options.chordCategoriesPool || ['triads', 'sevenths'];
        const randomCategoryKey = chordCategories[Math.floor(Math.random() * chordCategories.length)];
        const chordsInCategory = CHORD_TYPES[randomCategoryKey];

        const chordSymbols = Object.keys(chordsInCategory);
        const randomSymbol = chordSymbols[Math.floor(Math.random() * chordSymbols.length)];
        const selectedChordDef = chordsInCategory[randomSymbol];

        const rootNames = options.rootNoteNamesPool || ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const octaves = options.startOctavesPool || [3, 4];
        const rootName = rootNames[Math.floor(Math.random() * rootNames.length)];
        const startOctave = octaves[Math.floor(Math.random() * octaves.length)];
        const rootNoteFull = rootName + startOctave;
        const rootMidi = MusicTheory.noteToMidi(rootName, startOctave);

        let expectedNotes = [];
        if (rootMidi !== null && selectedChordDef && selectedChordDef.intervals) {
            expectedNotes = selectedChordDef.intervals.map(interval => {
                const noteObj = MusicTheory.midiToNote(rootMidi + interval);
                return noteObj.fullName; // e.g., C4, E4, G4
            });
        } else {
            console.error(`Failed to generate chord notes for ${rootNoteFull} ${selectedChordDef ? selectedChordDef.name : 'Unknown Chord'}`);
            expectedNotes = [rootNoteFull]; // Fallback
        }
        
        return {
            type: this.getExerciseTypeName(),
            instruction: options.instruction || `Build a ${rootNoteFull}${selectedChordDef.symbol} (${selectedChordDef.name}) chord.`,
            chordName: selectedChordDef.name, 
            chordSymbol: selectedChordDef.symbol,
            rootNoteFull: rootNoteFull, 
            expectedNotes: expectedNotes, // Array of full note names
            correctAnswer: `${rootNoteFull}${selectedChordDef.symbol}`, // String representation for simple validation, though array is better
            explanation: `A ${rootNoteFull}${selectedChordDef.symbol} (${selectedChordDef.name}) chord contains the notes: ${expectedNotes.join(' - ')}`,
            theorySnippet: `To build a ${selectedChordDef.name} chord, stack notes ${selectedChordDef.intervals.map(s => MusicTheory.getIntervalName(s, true)).join(', ')} from the root ${rootNoteFull}.`
            // No audioPlayback here as the user is performing.
        };
    }

    validateAnswer(userPlayedNotes, exerciseData) {
        // Logic from validateChordBuilding in exercise-engine.js
        // userPlayedNotes is expected to be an array of note fullNames
        if (!exerciseData || !exerciseData.expectedNotes) {
            console.error("Invalid exerciseData for validation", exerciseData);
            return false;
        }
        const expected = exerciseData.expectedNotes;
        if (!Array.isArray(userPlayedNotes) || userPlayedNotes.length !== expected.length) {
            return false;
        }
        // Convert to sets for order-independent comparison
        const playedSet = new Set(userPlayedNotes.map(n => n.trim())); // Ensure clean notes
        const expectedSet = new Set(expected.map(n => n.trim()));

        if (playedSet.size !== expectedSet.size) {
            return false;
        }

        for (const note of playedSet) {
            if (!expectedSet.has(note)) {
                return false;
            }
        }
        return true;
    }
}

if (typeof window !== 'undefined') {
    window.ChordIdentificationEngine = ChordIdentificationEngine;
    window.ChordBuildingEngine = ChordBuildingEngine;
}
