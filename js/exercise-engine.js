// Exercise Engine - Core training system for music theory and practice

class ExerciseEngine {
    constructor(audioEngine, piano) {
        this.audioEngine = audioEngine;
        this.piano = piano;
        
        // Exercise state
        this.currentExercise = null;
        this.exerciseData = null;
        this.isActive = false;
        this.startTime = null;
        this.attempts = 0;
        this.maxAttempts = 3;
        
        // Progress tracking
        this.sessionStats = {
            exercisesCompleted: 0,
            correctAnswers: 0,
            totalAttempts: 0,
            averageTime: 0,
            accuracy: 0
        };
        
        // Exercise types registry
        this.exerciseTypes = new Map();
        this.initializeExerciseTypes();
        
        // Curriculum structure
        this.curriculum = this.initializeCurriculum();
        this.currentLevel = this.loadProgress() || 1;
        this.pendingLevelUpNotification = null; 
        
        console.log('Exercise Engine initialized');
    }
    
    initializeExerciseTypes() {
        // Register all available exercise types
        this.exerciseTypes.set('note-identification', {
            name: 'Note Identification',
            description: 'Identify notes played on the piano',
            difficulty: 1,
            generator: this.generateNoteIdentification.bind(this),
            validator: this.validateNoteIdentification.bind(this)
        });
        
        this.exerciseTypes.set('interval-identification', {
            name: 'Interval Identification', 
            description: 'Identify intervals between two notes',
            difficulty: 2,
            generator: this.generateIntervalIdentification.bind(this),
            validator: this.validateIntervalIdentification.bind(this)
        });
        
        this.exerciseTypes.set('scale-practice', {
            name: 'Scale Practice',
            description: 'Play scales correctly in sequence',
            difficulty: 2,
            generator: this.generateScalePractice.bind(this),
            validator: this.validateScalePractice.bind(this)
        });
        
        this.exerciseTypes.set('chord-identification', {
            name: 'Chord Identification',
            description: 'Identify chord types when played',
            difficulty: 3,
            generator: this.generateChordIdentification.bind(this),
            validator: this.validateChordIdentification.bind(this)
        });
        
        this.exerciseTypes.set('chord-building', {
            name: 'Chord Building',
            description: 'Build chords from given names',
            difficulty: 3,
            generator: this.generateChordBuilding.bind(this),
            validator: this.validateChordBuilding.bind(this)
        });
    }
    
    initializeCurriculum() {
        return {
            1: { 
                name: "Intro to Notes", 
                exercises: ['note-identification'], 
                requiredAccuracy: 0.7, 
                minExercises: 5, 
                // Example: notesPool: ['C', 'F', 'G'], octavesPool: [4] // Generators not yet using these
            },
            2: { 
                name: "Basic Notes", 
                exercises: ['note-identification'], 
                requiredAccuracy: 0.7, 
                minExercises: 10,
                // Example: octavesPool: [3, 4, 5] // For C,D,E,F,G,A,B
            },
            3: { 
                name: "Accidentals", 
                exercises: ['note-identification'], 
                requiredAccuracy: 0.7, 
                minExercises: 10 
                // Example: includeAccidentals: true
            },
            4: { 
                name: "Basic Intervals", 
                exercises: ['interval-identification'], 
                requiredAccuracy: 0.7, 
                minExercises: 10, 
                // Example: intervalTypes: ['Major 3rd', 'Perfect 5th'], rootNoteOctaves: [3,4]
            },
            5: { 
                name: "More Intervals", 
                exercises: ['interval-identification'], 
                requiredAccuracy: 0.75, 
                minExercises: 15 
                // Wider range of intervals
            },
            6: { 
                name: "Major Scales", 
                exercises: ['scale-practice'], 
                requiredAccuracy: 0.8, 
                minExercises: 10, 
                // Example: scaleTypes: ['major'], rootNoteOctaves: [3,4]
            },
            7: { 
                name: "Minor Scales", 
                exercises: ['scale-practice'], 
                requiredAccuracy: 0.8, 
                minExercises: 10, 
                // Example: scaleTypes: ['minor']
            },
            8: { 
                name: "Major/Minor Triads (ID)", 
                exercises: ['chord-identification'], 
                requiredAccuracy: 0.8, 
                minExercises: 15,
                // Example: chordQualities: ['Major', 'Minor'] for CHORD_TYPES.triads
            },
            9: { 
                name: "Major/Minor Triads (Build)", 
                exercises: ['chord-building'], 
                requiredAccuracy: 0.8, 
                minExercises: 15,
                // Example: chordQualities: ['Major', 'Minor']
            },
            10: { 
                name: "All Triads & Basic 7ths (ID)", 
                exercises: ['chord-identification', 'interval-identification'], 
                requiredAccuracy: 0.85, 
                minExercises: 20 
                // Example: Include all triads, add dominant 7th, major 7th for ID
            },
            11: {
                name: "Building 7th Chords",
                exercises: ['chord-building'],
                requiredAccuracy: 0.85,
                minExercises: 15,
                // Example: chordQualities: ['Dominant 7th', 'Major 7th', 'Minor 7th']
            },
            12: {
                name: "Comprehensive Practice",
                exercises: ['note-identification', 'interval-identification', 'scale-practice', 'chord-identification', 'chord-building'],
                requiredAccuracy: 0.9,
                minExercises: 25
            }
        };
    }
    
    // Start a new exercise session
    startExercise(exerciseType = null) {
        if (this.isActive) {
            this.endExercise();
        }
        
        // Auto-select exercise based on current level if not specified
        if (!exerciseType) {
            const currentCurriculum = this.curriculum[this.currentLevel];
            const availableExercises = currentCurriculum.exercises;
            exerciseType = availableExercises[Math.floor(Math.random() * availableExercises.length)];
        }
        
        const exerciseConfig = this.exerciseTypes.get(exerciseType);
        if (!exerciseConfig) {
            console.error('Unknown exercise type:', exerciseType);
            this.currentExercise = null; // Ensure currentExercise is null if type is invalid
            this.isActive = false;
            return false;
        }
        
        this.currentExercise = exerciseType;
        this.exerciseData = exerciseConfig.generator();
        this.isActive = true;
        this.startTime = Date.now();
        this.attempts = 0;
        
        // this.displayExercise(); // Removed: UI rendering will be handled by app.js
        return true;
    }
    
    // Submit answer for current exercise
    submitAnswer(answer) { // `answer` here can be a string or an array for performance exercises
        if (!this.isActive || !this.currentExercise) {
            return { isCorrect: false, message: "Exercise not active.", action: 'error' };
        }
        
        this.attempts++;
        this.sessionStats.totalAttempts++;
        
        const exerciseConfig = this.exerciseTypes.get(this.currentExercise);
        const isCorrect = exerciseConfig.validator(answer, this.exerciseData);
        
        if (isCorrect) {
            return this.handleCorrectAnswer(answer); 
        } else {
            return this.handleIncorrectAnswer(answer); 
        }
    }
    
    handleCorrectAnswer(userInput) { // userInput is the answer submitted by the user
        const timeSpent = Date.now() - this.startTime;
        
        this.sessionStats.exercisesCompleted++;
        this.sessionStats.correctAnswers++;
        this.updateAverageTime(timeSpent);
        this.updateAccuracy();
        
        // Save progress
        this.saveProgress();
        
        let feedback = {
            isCorrect: true,
            message: `✅ Correct! (${this.attempts} ${this.attempts === 1 ? 'attempt' : 'attempts'})`,
            action: 'proceedToNext'
        };

        if (this.currentExercise === 'scale-practice' || this.currentExercise === 'chord-building') {
            feedback.playedNotes = userInput;
            feedback.expectedNotes = this.exerciseData.expectedNotes;
        }
        
        return feedback;
    }
    
    handleIncorrectAnswer(userInput) { // userInput is the answer submitted by the user
        let feedbackBase = {
            isCorrect: false,
            attemptsLeft: this.maxAttempts - this.attempts
        };

        if (this.currentExercise === 'scale-practice' || this.currentExercise === 'chord-building') {
            feedbackBase.playedNotes = userInput;
            feedbackBase.expectedNotes = this.exerciseData.expectedNotes;
        }

        if (this.attempts >= this.maxAttempts) {
            return {
                ...feedbackBase,
                message: `❌ The correct answer was: ${Array.isArray(this.exerciseData.correctAnswer) ? this.exerciseData.correctAnswer.join(', ') : this.exerciseData.correctAnswer}. ${this.exerciseData.explanation || ''}`,
                action: 'proceedToNext',
                correctAnswerDetails: this.exerciseData.correctAnswer, // For UI highlighting (string or array)
                explanation: this.exerciseData.explanation,
            };
        } else {
            return {
                ...feedbackBase,
                message: `❌ Try again. ${this.maxAttempts - this.attempts} attempts left.`,
                action: 'retry',
            };
        }
    }
    
    nextExercise() {
        this.pendingLevelUpNotification = null; // Clear any previous one
        this.checkLevelProgression(); // This might set pendingLevelUpNotification

        const notification = this.pendingLevelUpNotification; // Get it
        this.pendingLevelUpNotification = null; // Clear after getting

        this.startExercise(); // Sets up currentExercise for app.js

        // Return level up data if it occurred, otherwise null or an object indicating no level up.
        // App.js will check this return value.
        return notification; 
    }
    
    checkLevelProgression() {
        const currentCurriculum = this.curriculum[this.currentLevel];
        const nextLevel = this.currentLevel + 1;
        
        if (this.sessionStats.exercisesCompleted >= currentCurriculum.minExercises &&
            this.sessionStats.accuracy >= currentCurriculum.requiredAccuracy &&
            this.curriculum[nextLevel]) {
            
            this.currentLevel = nextLevel;
            this.pendingLevelUpNotification = this.getLevelUpNotificationData(); // Store it
            this.saveProgress();
        }
    }
    
    // Exercise generators
    generateNoteIdentification() {
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const octaves = [3, 4, 5];
        const accidentals = ['', '#'];
        
        let note, octave;
        do {
            note = notes[Math.floor(Math.random() * notes.length)];
            octave = octaves[Math.floor(Math.random() * octaves.length)];
            
            // Add accidentals (but not for E# or B#)
            if (note !== 'E' && note !== 'B' && Math.random() < 0.3) {
                note += accidentals[1]; // Add sharp
            }
        } while (note === 'E#' || note === 'B#');
        
        const fullNote = `${note}${octave}`; // e.g., C#4
        const noteNameOnly = note; // e.g., C#
        
        return {
            type: 'note-identification',
            question: 'What note was played?',
            targetNote: fullNote, // Used for playback, includes octave
            correctAnswer: noteNameOnly, // Just the note name, no octave
            explanation: `The note played was ${noteNameOnly} (octave ${octave}).`,
            theorySnippet: `A note's pitch is determined by its letter (A-G), accidental (#/b), and octave (e.g., C4 is Middle C).`,
            audioPlayback: { 
                type: 'note', 
                noteName: noteNameOnly, 
                octave: octave 
            }
        };
    }
    
    validateNoteIdentification(answer, exerciseData) {
        return answer.toLowerCase() === exerciseData.correctAnswer.toLowerCase();
    }
    
    generateIntervalIdentification() {
        const intervals = [
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
        
        const interval = intervals[Math.floor(Math.random() * intervals.length)];
        
        const rootNoteNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const rootOctaves = [2, 3, 4]; 
        const randomRootName = rootNoteNames[Math.floor(Math.random() * rootNoteNames.length)];
        const randomRootOctave = rootOctaves[Math.floor(Math.random() * rootOctaves.length)];
        const rootNoteFull = randomRootName + randomRootOctave; 
        const rootMidiVal = MusicTheory.noteToMidi(randomRootName, randomRootOctave);
        
        return {
            type: 'interval-identification',
            question: 'What interval was played?',
            interval: interval, // The interval object {name, semitones}
            rootNoteFull: rootNoteFull, // e.g., "C4"
            correctAnswer: interval.name,
            explanation: `The interval from ${rootNoteFull} was a ${interval.name}.`,
            theorySnippet: `An interval is the distance between two notes. A ${interval.name} is ${interval.semitones} semitones.`,
            audioPlayback: {
                type: 'interval',
                rootName: randomRootName,
                rootOctave: randomRootOctave,
                intervalSemitones: interval.semitones
            }
        };
    }
    
    validateIntervalIdentification(answer, exerciseData) {
        return answer.toLowerCase() === exerciseData.correctAnswer.toLowerCase();
    }
    
    generateScalePractice() {
        const scales = ['major', 'minor', 'pentatonic'];
        const rootNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        
        const scaleType = scales[Math.floor(Math.random() * scales.length)];
        const rootName = rootNames[Math.floor(Math.random() * rootNames.length)];
        
        const octaves = [3, 4]; 
        const startOctave = octaves[Math.floor(Math.random() * octaves.length)];
        const rootNoteFull = rootName + startOctave;
        
        const rootMidi = MusicTheory.noteToMidi(rootName, startOctave);
        const scaleDefinition = MusicTheory.SCALES[scaleType];
        
        let expectedNotes = [];
        if (scaleDefinition && rootMidi !== null) {
            expectedNotes = scaleDefinition.intervals.map(interval => {
                return MusicTheory.midiToNote(rootMidi + interval).fullName;
            });
            // Add the octave note
            expectedNotes.push(MusicTheory.midiToNote(rootMidi + 12).fullName);
        } else {
            console.error(`Failed to generate scale notes for ${rootNoteFull} ${scaleType}`);
            // Fallback to a default to prevent errors, though this indicates a problem
            expectedNotes = [`${rootName}${startOctave}`, `${rootName}${startOctave + 1}`]; 
        }
        
        return {
            type: 'scale-practice',
            instruction: `Play the ${rootName} ${scaleType} scale, starting on ${rootNoteFull} (1 octave ascending).`,
            scaleName: scaleType,
            rootNoteFull: rootNoteFull, 
            expectedNotes: expectedNotes, 
            correctAnswer: expectedNotes.join(' '), 
            explanation: `The ${rootName} ${scaleType} scale starting from ${rootNoteFull} is: ${expectedNotes.join(' - ')}`,
            theorySnippet: `The ${scaleDefinition ? scaleDefinition.name : scaleType} scale pattern of whole (W) and half (H) steps is: ${scaleDefinition ? scaleDefinition.formula : 'N/A'}.`
        };
    }
    
    validateScalePractice(userPlayedNotes, exerciseData) {
        const expected = exerciseData.expectedNotes;
        if (!userPlayedNotes || userPlayedNotes.length !== expected.length) {
            return false;
        }
        for (let i = 0; i < expected.length; i++) {
            if (userPlayedNotes[i] !== expected[i]) {
                return false;
            }
        }
        return true;
    }
    
    generateChordIdentification() {
        const triadKeys = Object.keys(CHORD_TYPES.triads);
        const randomTriadKey = triadKeys[Math.floor(Math.random() * triadKeys.length)];
        const selectedChordDef = CHORD_TYPES.triads[randomTriadKey]; // e.g., { name: 'Major', intervals: [0,4,7], symbol: '' }

        const rootNoteNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const rootOctaves = [3, 4]; 
        const randomRootName = rootNoteNames[Math.floor(Math.random() * rootNoteNames.length)];
        const randomRootOctave = rootOctaves[Math.floor(Math.random() * rootOctaves.length)];
        const rootNoteFull = randomRootName + randomRootOctave;
        const rootMidiVal = MusicTheory.noteToMidi(randomRootName, randomRootOctave);
        
        return {
            type: 'chord-identification',
            question: 'What type of chord was played?',
            chordType: selectedChordDef, 
            rootNoteFull: rootNoteFull,
            correctAnswer: selectedChordDef.name, // e.g., "Major"
            explanation: `The chord played (from ${rootNoteFull}) was ${randomRootName}${selectedChordDef.symbol}.`,
            theorySnippet: `A ${selectedChordDef.name} chord consists of notes at intervals of ${selectedChordDef.intervals.join(', ')} semitones above the root.`,
            audioPlayback: {
                type: 'chord',
                rootName: randomRootName,
                rootOctave: randomRootOctave,
                intervals: selectedChordDef.intervals // Array of semitone intervals
            }
        };
    }
    
    validateChordIdentification(answer, exerciseData) {
        return answer.toLowerCase() === exerciseData.correctAnswer.toLowerCase();
    }
    
    generateChordBuilding() {
        // Use CHORD_TYPES from music-theory.js
        const availableChordDefs = [ 
            CHORD_TYPES.triads[''], // Major
            CHORD_TYPES.triads['m'], // Minor
            CHORD_TYPES.triads['dim'], // Diminished
            CHORD_TYPES.triads['aug'], // Augmented
            CHORD_TYPES.sevenths['7'], // Dominant 7th
            CHORD_TYPES.sevenths['maj7'], // Major 7th
            CHORD_TYPES.sevenths['m7'], // Minor 7th
        ];
        
        const selectedChordDef = availableChordDefs[Math.floor(Math.random() * availableChordDefs.length)];

        const rootNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const octaves = [3, 4]; // Octave for the root note of the chord to be built
        const rootName = rootNames[Math.floor(Math.random() * rootNames.length)];
        const startOctave = octaves[Math.floor(Math.random() * octaves.length)];
        const rootNoteFull = rootName + startOctave;
        const rootMidi = MusicTheory.noteToMidi(rootName, startOctave);

        let expectedNotes = [];
        if (rootMidi !== null && selectedChordDef && selectedChordDef.intervals) {
            expectedNotes = selectedChordDef.intervals.map(interval => {
                return MusicTheory.midiToNote(rootMidi + interval).fullName;
            });
        } else {
            console.error(`Failed to generate chord notes for ${rootNoteFull} ${selectedChordDef ? selectedChordDef.name : 'Unknown Chord'}`);
            // Fallback
            expectedNotes = [`${rootName}${startOctave}`];
        }
        
        return {
            type: 'chord-building',
            instruction: `Build a ${rootNoteFull}${selectedChordDef.symbol} (${selectedChordDef.name}) chord.`,
            chordName: selectedChordDef.name, 
            chordSymbol: selectedChordDef.symbol,
            rootNoteFull: rootNoteFull, 
            expectedNotes: expectedNotes,
            correctAnswer: `${rootNoteFull}${selectedChordDef.symbol}`, 
            explanation: `A ${rootNoteFull}${selectedChordDef.symbol} (${selectedChordDef.name}) chord contains the notes: ${expectedNotes.join(' - ')}`,
            theorySnippet: `To build a ${selectedChordDef.name} chord, stack notes ${selectedChordDef.intervals.map(s => MusicTheory.getIntervalName(s)).join(', ')} from the root ${rootNoteFull}.`
        };
    }
    
    validateChordBuilding(userPlayedNotes, exerciseData) {
        const expected = exerciseData.expectedNotes;
        if (!userPlayedNotes || userPlayedNotes.length !== expected.length) {
            return false;
        }
        // Convert to sets for order-independent comparison
        const playedSet = new Set(userPlayedNotes);
        const expectedSet = new Set(expected);

        if (playedSet.size !== expectedSet.size) { // Should be covered by length check, but good for sets
            return false;
        }

        for (const note of playedSet) {
            if (!expectedSet.has(note)) {
                return false;
            }
        }
        return true;
    }
    
    // UI Methods
    // displayExercise(), renderExerciseContent(), and displayFeedback() removed as per refactoring.
    // UI rendering and feedback display will be handled by app.js
    
    getLevelUpNotificationData() {
        return {
            isLevelUp: true,
            level: this.currentLevel,
            message: `🎉 Level Up! Welcome to Level ${this.currentLevel}! New challenges and exercises await!`
        };
    }
    
    endExercise() {
        this.isActive = false;
        this.currentExercise = null;
        this.exerciseData = null;
        
        const exercisePanel = document.getElementById('exercise-panel');
        if (exercisePanel) {
            exercisePanel.style.display = 'none';
        }
    }
    
    // Progress management
    updateAverageTime(timeSpent) {
        const totalTime = this.sessionStats.averageTime * (this.sessionStats.exercisesCompleted - 1) + timeSpent;
        this.sessionStats.averageTime = totalTime / this.sessionStats.exercisesCompleted;
    }
    
    updateAccuracy() {
        this.sessionStats.accuracy = this.sessionStats.correctAnswers / this.sessionStats.totalAttempts;
    }
    
    saveProgress() {
        const progress = {
            currentLevel: this.currentLevel,
            sessionStats: this.sessionStats,
            lastSession: Date.now()
        };
        
        localStorage.setItem('musicTrainingProgress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('musicTrainingProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            return progress.currentLevel || 1;
        }
        return 1;
    }
    
    // Public API methods
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    getSessionStats() {
        return { ...this.sessionStats };
    }
    
    getAvailableExercises() {
        const currentCurriculum = this.curriculum[this.currentLevel];
        return currentCurriculum.exercises.map(type => ({
            type: type,
            ...this.exerciseTypes.get(type)
        }));
    }

    getCurrentLevelData() {
        if (this.curriculum && this.curriculum[this.currentLevel]) {
            return this.curriculum[this.currentLevel];
        }
        return null; // Or a default object like { name: 'Unknown Level', minExercises: 'N/A', requiredAccuracy: 0 }
    }

    resetProgressToLevel1() {
        this.currentLevel = 1;
        this.sessionStats = { // Reset session stats as well
            exercisesCompleted: 0,
            correctAnswers: 0,
            totalAttempts: 0,
            averageTime: 0,
            accuracy: 0
        };
        // Any other level-specific progress stored elsewhere should also be reset here.
        this.saveProgress(); // This already saves currentLevel and sessionStats
        console.log('Progress reset to Level 1 and session stats cleared.');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExerciseEngine;
} else {
    window.ExerciseEngine = ExerciseEngine;
}
