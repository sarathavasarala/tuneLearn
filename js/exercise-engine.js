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
            1: { // Beginner
                name: "Note Basics",
                exercises: ['note-identification'],
                requiredAccuracy: 0.7,
                minExercises: 10
            },
            2: {
                name: "Intervals", 
                exercises: ['note-identification', 'interval-identification'],
                requiredAccuracy: 0.75,
                minExercises: 15
            },
            3: {
                name: "Scales",
                exercises: ['note-identification', 'interval-identification', 'scale-practice'],
                requiredAccuracy: 0.8,
                minExercises: 20
            },
            4: {
                name: "Basic Chords",
                exercises: ['chord-identification', 'chord-building'],
                requiredAccuracy: 0.8,
                minExercises: 25
            },
            5: {
                name: "Advanced Theory",
                exercises: ['chord-identification', 'chord-building', 'scale-practice'],
                requiredAccuracy: 0.85,
                minExercises: 30
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
            return false;
        }
        
        this.currentExercise = exerciseType;
        this.exerciseData = exerciseConfig.generator();
        this.isActive = true;
        this.startTime = Date.now();
        this.attempts = 0;
        
        this.displayExercise();
        return true;
    }
    
    // Submit answer for current exercise
    submitAnswer(answer) {
        if (!this.isActive || !this.currentExercise) {
            return false;
        }
        
        this.attempts++;
        this.sessionStats.totalAttempts++;
        
        const exerciseConfig = this.exerciseTypes.get(this.currentExercise);
        const isCorrect = exerciseConfig.validator(answer, this.exerciseData);
        
        if (isCorrect) {
            this.handleCorrectAnswer();
            return true;
        } else {
            this.handleIncorrectAnswer();
            return false;
        }
    }
    
    handleCorrectAnswer() {
        const timeSpent = Date.now() - this.startTime;
        
        this.sessionStats.exercisesCompleted++;
        this.sessionStats.correctAnswers++;
        this.updateAverageTime(timeSpent);
        this.updateAccuracy();
        
        this.displayFeedback('correct', {
            timeSpent: timeSpent,
            attempts: this.attempts
        });
        
        // Save progress
        this.saveProgress();
        
        // Auto-advance to next exercise after short delay
        setTimeout(() => {
            this.nextExercise();
        }, 2000);
    }
    
    handleIncorrectAnswer() {
        if (this.attempts >= this.maxAttempts) {
            this.displayFeedback('failed', {
                correctAnswer: this.exerciseData.correctAnswer,
                explanation: this.exerciseData.explanation
            });
            
            setTimeout(() => {
                this.nextExercise();
            }, 3000);
        } else {
            this.displayFeedback('incorrect', {
                attemptsLeft: this.maxAttempts - this.attempts
            });
        }
    }
    
    nextExercise() {
        // Check if user should level up
        this.checkLevelProgression();
        
        // Start next exercise
        this.startExercise();
    }
    
    checkLevelProgression() {
        const currentCurriculum = this.curriculum[this.currentLevel];
        const nextLevel = this.currentLevel + 1;
        
        if (this.sessionStats.exercisesCompleted >= currentCurriculum.minExercises &&
            this.sessionStats.accuracy >= currentCurriculum.requiredAccuracy &&
            this.curriculum[nextLevel]) {
            
            this.currentLevel = nextLevel;
            this.displayLevelUp();
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
        
        const fullNote = `${note}${octave}`;
        
        return {
            type: 'note-identification',
            targetNote: fullNote,
            correctAnswer: note, // Just the note name without octave
            explanation: `The note played was ${note}`,
            playNote: () => {
                const noteMatch = fullNote.match(/^([A-G]#?)(\d+)$/);
                if (noteMatch) {
                    this.audioEngine.playNote(noteMatch[1], parseInt(noteMatch[2]), 0.8, 2);
                }
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
        const rootNote = 'C4'; // Keep it simple for now
        
        return {
            type: 'interval-identification',
            interval: interval,
            rootNote: rootNote,
            correctAnswer: interval.name,
            explanation: `The interval was a ${interval.name}`,
            playInterval: () => {
                // Play root note
                this.audioEngine.playNote('C', 4, 0.8, 1);
                
                // Play target note after delay
                setTimeout(() => {
                    const targetMidi = MusicTheory.noteToMidi('C', 4) + interval.semitones;
                    const frequency = MusicTheory.midiToFrequency(targetMidi);
                    // For now, approximate the note - we'll improve this later
                    this.audioEngine.playNote('C', 4, 0.8, 1);
                }, 1000);
            }
        };
    }
    
    validateIntervalIdentification(answer, exerciseData) {
        return answer.toLowerCase() === exerciseData.correctAnswer.toLowerCase();
    }
    
    generateScalePractice() {
        const scales = ['major', 'minor', 'pentatonic'];
        const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        
        const scale = scales[Math.floor(Math.random() * scales.length)];
        const root = roots[Math.floor(Math.random() * roots.length)];
        
        const scaleNotes = MusicTheory.getScale(root, scale);
        
        return {
            type: 'scale-practice',
            scale: scale,
            root: root,
            expectedNotes: scaleNotes,
            userNotes: [],
            correctAnswer: scaleNotes.join(' '),
            explanation: `The ${root} ${scale} scale: ${scaleNotes.join(' - ')}`
        };
    }
    
    validateScalePractice(userNotes, exerciseData) {
        if (userNotes.length !== exerciseData.expectedNotes.length) {
            return false;
        }
        
        for (let i = 0; i < userNotes.length; i++) {
            if (userNotes[i] !== exerciseData.expectedNotes[i]) {
                return false;
            }
        }
        return true;
    }
    
    generateChordIdentification() {
        const chordTypes = [
            { name: 'Major', notes: [0, 4, 7] },
            { name: 'Minor', notes: [0, 3, 7] },
            { name: 'Diminished', notes: [0, 3, 6] },
            { name: 'Augmented', notes: [0, 4, 8] }
        ];
        
        const chordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
        const root = 'C'; // Keep simple for now
        
        return {
            type: 'chord-identification',
            chordType: chordType,
            root: root,
            correctAnswer: chordType.name,
            explanation: `The chord was ${root} ${chordType.name}`,
            playChord: () => {
                // Play all notes of the chord simultaneously
                chordType.notes.forEach(interval => {
                    const midi = MusicTheory.noteToMidi('C', 4) + interval;
                    const note = MusicTheory.midiToNote(midi);
                    this.audioEngine.playNote(note.note, note.octave, 0.6, 3);
                });
            }
        };
    }
    
    validateChordIdentification(answer, exerciseData) {
        return answer.toLowerCase() === exerciseData.correctAnswer.toLowerCase();
    }
    
    generateChordBuilding() {
        const chordTypes = [
            { name: 'Major', notes: [0, 4, 7] },
            { name: 'Minor', notes: [0, 3, 7] }
        ];
        
        const chordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
        const root = 'C';
        
        return {
            type: 'chord-building',
            chordType: chordType,
            root: root,
            expectedNotes: chordType.notes.map(interval => {
                const midi = MusicTheory.noteToMidi('C', 4) + interval;
                return MusicTheory.midiToNote(midi);
            }),
            userNotes: [],
            correctAnswer: `${root} ${chordType.name}`,
            explanation: `${root} ${chordType.name} chord contains the notes: ${chordType.notes.map(interval => {
                const midi = MusicTheory.noteToMidi('C', 4) + interval;
                return MusicTheory.midiToNote(midi).note;
            }).join(' - ')}`
        };
    }
    
    validateChordBuilding(userNotes, exerciseData) {
        // Check if user played the correct notes
        const expectedNoteNames = exerciseData.expectedNotes.map(n => n.note);
        const userNoteNames = userNotes.map(note => note.replace(/\d+/, ''));
        
        return expectedNoteNames.every(note => userNoteNames.includes(note)) &&
               userNoteNames.length === expectedNoteNames.length;
    }
    
    // UI Methods
    displayExercise() {
        const exercisePanel = document.getElementById('exercise-panel');
        if (!exercisePanel) return;
        
        const config = this.exerciseTypes.get(this.currentExercise);
        
        exercisePanel.innerHTML = `
            <div class="exercise-header">
                <h3>${config.name}</h3>
                <div class="exercise-progress">
                    Level ${this.currentLevel} | Exercise ${this.sessionStats.exercisesCompleted + 1}
                </div>
            </div>
            <div class="exercise-content">
                ${this.renderExerciseContent()}
            </div>
            <div class="exercise-stats">
                Accuracy: ${(this.sessionStats.accuracy * 100).toFixed(1)}% | 
                Completed: ${this.sessionStats.exercisesCompleted}
            </div>
        `;
        
        exercisePanel.style.display = 'block';
        
        // Auto-play audio for listening exercises
        if (this.exerciseData.playNote) {
            setTimeout(() => this.exerciseData.playNote(), 500);
        }
        if (this.exerciseData.playInterval) {
            setTimeout(() => this.exerciseData.playInterval(), 500);
        }
        if (this.exerciseData.playChord) {
            setTimeout(() => this.exerciseData.playChord(), 500);
        }
    }
    
    renderExerciseContent() {
        switch (this.currentExercise) {
            case 'note-identification':
                return `
                    <div class="exercise-question">
                        <p>What note was played?</p>
                        <button onclick="exerciseEngine.exerciseData.playNote()" class="btn btn-primary">
                            🔊 Play Again
                        </button>
                    </div>
                    <div class="exercise-answers">
                        ${['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => `
                            <button onclick="exerciseEngine.submitAnswer('${note}')" class="btn btn-answer">
                                ${note}
                            </button>
                        `).join('')}
                        ${['C#', 'D#', 'F#', 'G#', 'A#'].map(note => `
                            <button onclick="exerciseEngine.submitAnswer('${note}')" class="btn btn-answer btn-accidental">
                                ${note}
                            </button>
                        `).join('')}
                    </div>
                `;
                
            case 'interval-identification':
                return `
                    <div class="exercise-question">
                        <p>What interval was played?</p>
                        <button onclick="exerciseEngine.exerciseData.playInterval()" class="btn btn-primary">
                            🔊 Play Again
                        </button>
                    </div>
                    <div class="exercise-answers">
                        ${['Perfect Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th', 'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th', 'Major 7th', 'Perfect Octave'].map(interval => `
                            <button onclick="exerciseEngine.submitAnswer('${interval}')" class="btn btn-answer">
                                ${interval}
                            </button>
                        `).join('')}
                    </div>
                `;
                
            case 'chord-identification':
                return `
                    <div class="exercise-question">
                        <p>What type of chord was played?</p>
                        <button onclick="exerciseEngine.exerciseData.playChord()" class="btn btn-primary">
                            🔊 Play Again
                        </button>
                    </div>
                    <div class="exercise-answers">
                        ${['Major', 'Minor', 'Diminished', 'Augmented'].map(chord => `
                            <button onclick="exerciseEngine.submitAnswer('${chord}')" class="btn btn-answer">
                                ${chord}
                            </button>
                        `).join('')}
                    </div>
                `;
                
            default:
                return '<p>Exercise content not implemented yet.</p>';
        }
    }
    
    displayFeedback(type, data) {
        const feedbackDiv = document.getElementById('exercise-feedback');
        if (!feedbackDiv) return;
        
        let message = '';
        let className = '';
        
        switch (type) {
            case 'correct':
                message = `✅ Correct! (${data.attempts} ${data.attempts === 1 ? 'attempt' : 'attempts'})`;
                className = 'feedback-correct';
                break;
            case 'incorrect':
                message = `❌ Try again. ${data.attemptsLeft} attempts left.`;
                className = 'feedback-incorrect';
                break;
            case 'failed':
                message = `❌ The correct answer was: ${data.correctAnswer}<br><small>${data.explanation}</small>`;
                className = 'feedback-failed';
                break;
        }
        
        feedbackDiv.innerHTML = message;
        feedbackDiv.className = `exercise-feedback ${className}`;
        feedbackDiv.style.display = 'block';
        
        // Hide feedback after delay for correct answers
        if (type === 'correct') {
            setTimeout(() => {
                feedbackDiv.style.display = 'none';
            }, 1500);
        }
    }
    
    displayLevelUp() {
        const feedbackDiv = document.getElementById('exercise-feedback');
        if (!feedbackDiv) return;
        
        feedbackDiv.innerHTML = `🎉 Level Up! Welcome to Level ${this.currentLevel}!`;
        feedbackDiv.className = 'exercise-feedback feedback-levelup';
        feedbackDiv.style.display = 'block';
        
        setTimeout(() => {
            feedbackDiv.style.display = 'none';
        }, 3000);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExerciseEngine;
} else {
    window.ExerciseEngine = ExerciseEngine;
}
