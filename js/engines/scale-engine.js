// js/engines/scale-engine.js
if (typeof window.MusicTheoryEngine === 'undefined') {
    console.error("MusicTheoryEngine base class not loaded.");
}
if (typeof window.MusicTheory === 'undefined') {
    console.error("MusicTheory utility class not loaded.");
}

class ScalePracticeEngine extends MusicTheoryEngine {
    constructor() {
        super('scale-practice');
    }

    generateExercise(options = {}) {
        // Logic from generateScalePractice in exercise-engine.js
        const scaleTypes = options.scaleTypesPool || ['major', 'natural_minor', 'pentatonic_major']; // Using keys from MusicTheory.SCALES
        const rootNames = options.rootNoteNamesPool || ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        
        const scaleKey = scaleTypes[Math.floor(Math.random() * scaleTypes.length)];
        const scaleDefinition = MusicTheory.SCALES[scaleKey];
        const scaleDisplayName = scaleDefinition ? scaleDefinition.name : scaleKey; // e.g. "Major" or "Natural Minor"

        const rootName = rootNames[Math.floor(Math.random() * rootNames.length)];
        
        const octaves = options.startOctavesPool || [3, 4]; 
        const startOctave = octaves[Math.floor(Math.random() * octaves.length)];
        const rootNoteFull = rootName + startOctave;
        
        const rootMidi = MusicTheory.noteToMidi(rootName, startOctave);
        
        let expectedNotes = [];
        if (scaleDefinition && rootMidi !== null) {
            expectedNotes = scaleDefinition.intervals.map(interval => {
                const noteObj = MusicTheory.midiToNote(rootMidi + interval);
                return noteObj.fullName; // e.g., C4, D#5
            });
            // Add the octave note
            const octaveNoteObj = MusicTheory.midiToNote(rootMidi + 12);
            expectedNotes.push(octaveNoteObj.fullName);
        } else {
            console.error(`Failed to generate scale notes for ${rootNoteFull} ${scaleKey}`);
            expectedNotes = [`${rootName}${startOctave}`, `${rootName}${startOctave + 1}`]; // Fallback
        }
        
        return {
            type: this.getExerciseTypeName(),
            instruction: options.instruction || `Play the ${rootName} ${scaleDisplayName} scale, starting on ${rootNoteFull} (1 octave ascending).`,
            scaleName: scaleDisplayName,
            rootNoteFull: rootNoteFull, 
            expectedNotes: expectedNotes, // Array of full note names, e.g., ["C4", "D4", "E4"...]
            correctAnswer: expectedNotes.join(' '), // String representation for simple validation if needed, though array is better
            explanation: `The ${rootName} ${scaleDisplayName} scale starting from ${rootNoteFull} is: ${expectedNotes.join(' - ')}`,
            theorySnippet: `The ${scaleDisplayName} scale pattern of whole (W) and half (H) steps is: ${scaleDefinition ? scaleDefinition.formula : 'N/A'}.`
            // No audioPlayback here as the user is performing. Audio cues could be an option.
        };
    }

    validateAnswer(userPlayedNotes, exerciseData) {
        // Logic from validateScalePractice in exercise-engine.js
        // userPlayedNotes is expected to be an array of note fullNames, e.g., ["C4", "D4", ...]
        if (!exerciseData || !exerciseData.expectedNotes) {
            console.error("Invalid exerciseData for validation", exerciseData);
            return false;
        }
        const expected = exerciseData.expectedNotes;
        if (!Array.isArray(userPlayedNotes) || userPlayedNotes.length !== expected.length) {
            return false;
        }
        for (let i = 0; i < expected.length; i++) {
            // Normalize or ensure consistent format if necessary, though piano-keyboard output should be consistent
            if (userPlayedNotes[i] !== expected[i]) { 
                return false;
            }
        }
        return true;
    }
}

if (typeof window !== 'undefined') {
    window.ScalePracticeEngine = ScalePracticeEngine;
}
