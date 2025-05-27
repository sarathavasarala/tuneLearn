// js/engines/note-engine.js
if (typeof window.MusicTheoryEngine === 'undefined') {
    console.error("MusicTheoryEngine base class not loaded. Make sure base-engine.js is loaded before note-engine.js");
}

class NoteIdentificationEngine extends MusicTheoryEngine {
    constructor() {
        super('note-identification');
    }

    generateExercise(options = {}) {
        // Logic from generateNoteIdentification in exercise-engine.js
        // Assuming MusicTheory is globally available or passed via options if needed.
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const octaves = options.octavesPool || [3, 4, 5]; // Example of using options
        const includeAccidentals = typeof options.includeAccidentals !== 'undefined' ? options.includeAccidentals : true;

        let noteNameOnly;
        let octave;
        let attemptCount = 0; // To prevent infinite loops if options are too restrictive

        do {
            noteNameOnly = notes[Math.floor(Math.random() * notes.length)];
            octave = octaves[Math.floor(Math.random() * octaves.length)];
            
            if (includeAccidentals && noteNameOnly !== 'E' && noteNameOnly !== 'B' && Math.random() < 0.4) { // Increased chance for testing
                noteNameOnly += '#';
            }
            attemptCount++;
            if (attemptCount > 50) { // Safety break
                console.warn("Could not generate a valid note with current options. Defaulting.");
                noteNameOnly = "C"; // Default fallback
                octave = 4;
                break;
            }
        } while (noteNameOnly === 'E#' || noteNameOnly === 'B#'); // Basic validation
        
        const fullNote = `${noteNameOnly}${octave}`;
        
        // Create options for multiple choice
        const allPossibleNoteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let mcOptions = [noteNameOnly];
        while (mcOptions.length < (options.numOptions || 4)) {
            const randomNote = allPossibleNoteNames[Math.floor(Math.random() * allPossibleNoteNames.length)];
            if (!mcOptions.includes(randomNote)) {
                mcOptions.push(randomNote);
            }
        }
        // Shuffle options (simple shuffle)
        mcOptions.sort(() => Math.random() - 0.5);

        return {
            type: this.getExerciseTypeName(), // 'note-identification'
            question: options.question || 'What note was played?',
            targetNote: fullNote, // For playback, includes octave
            correctAnswer: noteNameOnly, // Just the note name, no octave
            options: mcOptions, // For multiple choice UI
            explanation: `The note played was ${noteNameOnly} (octave ${octave}).`,
            theorySnippet: `A note's pitch is determined by its letter (A-G), accidental (#/b), and octave (e.g., C4 is Middle C).`,
            audioPlayback: { 
                type: 'note', 
                noteName: noteNameOnly, 
                octave: octave 
            }
        };
    }

    validateAnswer(userInput, exerciseData) {
        // Logic from validateNoteIdentification in exercise-engine.js
        if (!exerciseData || typeof exerciseData.correctAnswer === 'undefined') {
            console.error("Invalid exerciseData for validation", exerciseData);
            return false;
        }
        return userInput.trim().toLowerCase() === exerciseData.correctAnswer.toLowerCase();
    }

    // getTheorySnippet is inherited from MusicTheoryEngine, 
    // and the default implementation should work if theorySnippet is in exerciseData.
}

// Assuming global scope for now
if (typeof window !== 'undefined') {
    window.NoteIdentificationEngine = NoteIdentificationEngine;
}
