// js/engines/interval-engine.js
if (typeof window.MusicTheoryEngine === 'undefined') {
    console.error("MusicTheoryEngine base class not loaded. Make sure base-engine.js is loaded before this file.");
}
if (typeof window.MusicTheory === 'undefined') {
    console.error("MusicTheory utility class not loaded. Make sure music-theory.js is loaded before this file.");
}

class IntervalIdentificationEngine extends MusicTheoryEngine {
    constructor() {
        super('interval-identification');
    }

    generateExercise(options = {}) {
        // Logic from generateIntervalIdentification in exercise-engine.js
        const intervals = options.intervalsPool || [
            { name: 'Perfect Unison', semitones: 0 },
            { name: 'Minor 2nd', semitones: 1 },
            { name: 'Major 2nd', semitones: 2 },
            { name: 'Minor 3rd', semitones: 3 },
            { name: 'Major 3rd', semitones: 4 },
            { name: 'Perfect 4th', semitones: 5 },
            { name: 'Perfect 5th', semitones: 7 },
            { name: 'Minor 6th', semitones: 8 },
            { name: 'Major 6th', semitones: 9 },
            { name: 'Minor 7th', semitones: 10 },
            { name: 'Major 7th', semitones: 11 },
            { name: 'Perfect Octave', semitones: 12 }
        ];
        
        const selectedInterval = intervals[Math.floor(Math.random() * intervals.length)];
        
        const rootNoteNames = options.rootNoteNamesPool || ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const rootOctaves = options.rootOctavesPool || [2, 3, 4]; 
        const randomRootName = rootNoteNames[Math.floor(Math.random() * rootNoteNames.length)];
        const randomRootOctave = rootOctaves[Math.floor(Math.random() * rootOctaves.length)];
        const rootNoteFull = randomRootName + randomRootOctave; 
        
        // Create multiple choice options
        let mcOptions = [selectedInterval.name];
        while (mcOptions.length < (options.numOptions || 4)) {
            const randomInterval = intervals[Math.floor(Math.random() * intervals.length)].name;
            if (!mcOptions.includes(randomInterval)) {
                mcOptions.push(randomInterval);
            }
        }
        mcOptions.sort(() => Math.random() - 0.5); // Shuffle

        return {
            type: this.getExerciseTypeName(),
            question: options.question || 'What interval was played?',
            interval: selectedInterval, // The interval object {name, semitones}
            rootNoteFull: rootNoteFull, // e.g., "C4"
            correctAnswer: selectedInterval.name,
            options: mcOptions,
            explanation: `The interval from ${rootNoteFull} was a ${selectedInterval.name}.`,
            theorySnippet: `An interval is the distance between two notes. A ${selectedInterval.name} is ${selectedInterval.semitones} semitones.`,
            audioPlayback: {
                type: 'interval',
                rootName: randomRootName,
                rootOctave: randomRootOctave,
                intervalSemitones: selectedInterval.semitones
            }
        };
    }

    validateAnswer(userInput, exerciseData) {
        // Logic from validateIntervalIdentification in exercise-engine.js
        if (!exerciseData || typeof exerciseData.correctAnswer === 'undefined') {
            console.error("Invalid exerciseData for validation", exerciseData);
            return false;
        }
        return userInput.trim().toLowerCase() === exerciseData.correctAnswer.toLowerCase();
    }
}

if (typeof window !== 'undefined') {
    window.IntervalIdentificationEngine = IntervalIdentificationEngine;
}
