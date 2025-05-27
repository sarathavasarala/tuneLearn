// Practice Tools Module

class PracticeTools {
    constructor(audioEngine, pianoKeyboard, chordDetection) {
        this.audioEngine = audioEngine;
        this.pianoKeyboard = pianoKeyboard;
        this.chordDetection = chordDetection;
        
        // Practice session data
        this.session = {
            startTime: null,
            endTime: null,
            totalNotes: 0,
            totalChords: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            practiceType: null
        };
        
        // Practice modes
        this.modes = {
            chordIdentification: {
                name: 'Chord Identification',
                active: false,
                currentChord: null,
                waitingForAnswer: false
            },
            scaleExercises: {
                name: 'Scale Exercises',
                active: false,
                currentScale: null,
                currentNote: 0
            },
            intervalTraining: {
                name: 'Interval Training',
                active: false,
                currentInterval: null,
                waitingForAnswer: false
            },
            randomChordGenerator: {
                name: 'Random Chord Generator',
                active: false,
                chordQueue: []
            }
        };
        
        // Statistics tracking
        this.stats = {
            sessionsCompleted: 0,
            totalPracticeTime: 0,
            notesPlayed: 0,
            chordsPlayed: 0,
            accuracy: 0,
            streaks: {
                current: 0,
                best: 0
            },
            favoriteChords: {},
            weakChords: {},
            practiceHistory: []
        };
        
        // Load saved stats
        this.loadStats();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Random chord button
        const randomChordBtn = document.getElementById('random-chord');
        if (randomChordBtn) {
            randomChordBtn.addEventListener('click', () => this.generateRandomChord());
        }
        
        // Practice mode buttons would go here
        // Add more event listeners as needed
    }
    
    // Start a practice session
    startSession(mode) {
        this.session = {
            startTime: Date.now(),
            endTime: null,
            totalNotes: 0,
            totalChords: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            practiceType: mode
        };
        
        // Activate the selected mode
        Object.keys(this.modes).forEach(key => {
            this.modes[key].active = false;
        });
        
        if (this.modes[mode]) {
            this.modes[mode].active = true;
            this.initializeMode(mode);
        }
        
        console.log(`Started practice session: ${mode}`);
    }
    
    // End current practice session
    endSession() {
        if (this.session.startTime) {
            this.session.endTime = Date.now();
            const duration = this.session.endTime - this.session.startTime;
            
            // Update global stats
            this.stats.sessionsCompleted++;
            this.stats.totalPracticeTime += duration;
            this.stats.notesPlayed += this.session.totalNotes;
            this.stats.chordsPlayed += this.session.totalChords;
            
            // Calculate accuracy
            const totalAnswers = this.session.correctAnswers + this.session.wrongAnswers;
            if (totalAnswers > 0) {
                this.stats.accuracy = (this.session.correctAnswers / totalAnswers) * 100;
            }
            
            // Add to practice history
            this.stats.practiceHistory.push({
                ...this.session,
                duration: duration
            });
            
            // Keep only last 50 sessions
            if (this.stats.practiceHistory.length > 50) {
                this.stats.practiceHistory.shift();
            }
            
            // Save stats
            this.saveStats();
            
            // Deactivate all modes
            Object.keys(this.modes).forEach(key => {
                this.modes[key].active = false;
            });
            
            console.log('Practice session ended');
            this.showSessionSummary();
        }
    }
    
    // Initialize specific practice mode
    initializeMode(mode) {
        switch (mode) {
            case 'chordIdentification':
                this.startChordIdentification();
                break;
            case 'scaleExercises':
                this.startScaleExercises();
                break;
            case 'intervalTraining':
                this.startIntervalTraining();
                break;
            case 'randomChordGenerator':
                this.startRandomChordGenerator();
                break;
        }
    }
    
    // Chord Identification Mode
    startChordIdentification() {
        const mode = this.modes.chordIdentification;
        mode.currentChord = this.generateRandomChord();
        mode.waitingForAnswer = true;
        
        // Play the chord
        if (mode.currentChord && this.audioEngine) {
            this.audioEngine.playChord(mode.currentChord.notes, 4, 0.6, 2);
        }
        
        this.updateUI();
    }
    
    checkChordAnswer(userAnswer) {
        const mode = this.modes.chordIdentification;
        if (!mode.active || !mode.waitingForAnswer) return;
        
        const correct = userAnswer.toLowerCase() === mode.currentChord.name.toLowerCase();
        
        if (correct) {
            this.session.correctAnswers++;
            this.stats.streaks.current++;
            if (this.stats.streaks.current > this.stats.streaks.best) {
                this.stats.streaks.best = this.stats.streaks.current;
            }
            this.showFeedback('Correct!', 'success');
        } else {
            this.session.wrongAnswers++;
            this.stats.streaks.current = 0;
            this.showFeedback(`Incorrect. It was ${mode.currentChord.name}`, 'error');
        }
        
        // Track chord statistics
        const chordName = mode.currentChord.name;
        if (correct) {
            this.stats.favoriteChords[chordName] = (this.stats.favoriteChords[chordName] || 0) + 1;
        } else {
            this.stats.weakChords[chordName] = (this.stats.weakChords[chordName] || 0) + 1;
        }
        
        mode.waitingForAnswer = false;
        
        // Generate next chord after delay
        setTimeout(() => {
            this.startChordIdentification();
        }, 2000);
    }
    
    // Scale Exercises Mode
    startScaleExercises() {
        const mode = this.modes.scaleExercises;
        const scales = Object.keys(SCALES);
        const randomScale = scales[Math.floor(Math.random() * scales.length)];
        const randomRoot = NOTES[Math.floor(Math.random() * NOTES.length)];
        
        mode.currentScale = {
            root: randomRoot,
            type: randomScale,
            notes: MusicTheory.getScaleNotes(randomRoot, randomScale)
        };
        mode.currentNote = 0;
        
        // Set piano to scale mode
        if (this.pianoKeyboard) {
            this.pianoKeyboard.setScale(randomRoot, randomScale);
        }
        
        this.updateUI();
    }
    
    // Interval Training Mode
    startIntervalTraining() {
        const mode = this.modes.intervalTraining;
        const intervals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const randomInterval = intervals[Math.floor(Math.random() * intervals.length)];
        const rootNote = NOTES[Math.floor(Math.random() * NOTES.length)];
        
        mode.currentInterval = {
            root: rootNote,
            interval: randomInterval,
            targetNote: NOTES[(NOTES.indexOf(rootNote) + randomInterval) % 12],
            name: MusicTheory.getIntervalName(randomInterval)
        };
        mode.waitingForAnswer = true;
        
        // Play the interval
        if (this.audioEngine) {
            this.audioEngine.playNote(rootNote, 4, 0.6, 1);
            setTimeout(() => {
                this.audioEngine.playNote(mode.currentInterval.targetNote, 4, 0.6, 1);
            }, 1000);
        }
        
        this.updateUI();
    }
    
    // Random Chord Generator
    generateRandomChord() {
        const categories = Object.keys(CHORD_TYPES);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const chords = Object.keys(CHORD_TYPES[randomCategory]);
        const randomChordType = chords[Math.floor(Math.random() * chords.length)];
        const randomRoot = NOTES[Math.floor(Math.random() * NOTES.length)];
        
        const chordNotes = MusicTheory.getChordNotes(randomRoot, randomChordType, randomCategory);
        const chordDef = CHORD_TYPES[randomCategory][randomChordType];
        
        const chord = {
            root: randomRoot,
            type: randomChordType,
            category: randomCategory,
            name: randomRoot + chordDef.symbol,
            fullName: randomRoot + ' ' + chordDef.name,
            notes: chordNotes
        };
        
        // Update UI to show the chord
        this.displayRandomChord(chord);
        
        // Highlight chord on piano
        if (this.pianoKeyboard) {
            this.pianoKeyboard.highlightChord(chordNotes, randomRoot);
        }
        
        // Play the chord
        if (this.audioEngine) {
            this.audioEngine.playChord(chordNotes, 4, 0.6, 3);
        }
        
        return chord;
    }
    
    // Display random chord in UI
    displayRandomChord(chord) {
        const display = document.getElementById('chord-display');
        if (display) {
            display.innerHTML = `
                <div class="random-chord-display">
                    <h4>${chord.name}</h4>
                    <p>${chord.fullName}</p>
                    <div class="chord-notes">
                        ${chord.notes.map(note => `<span class="note-chip">${note}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    // Show feedback to user
    showFeedback(message, type) {
        // Create feedback element if it doesn't exist
        let feedback = document.getElementById('practice-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'practice-feedback';
            feedback.className = 'practice-feedback';
            document.body.appendChild(feedback);
        }
        
        feedback.textContent = message;
        feedback.className = `practice-feedback ${type}`;
        feedback.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 3000);
    }
    
    // Update UI elements
    updateUI() {
        this.updateStats();
        this.updateModeDisplays();
    }
    
    // Update statistics display
    updateStats() {
        // Update various UI elements with current stats
        // This would update progress bars, counters, etc.
        console.log('Current stats:', this.stats);
    }
    
    // Update mode-specific displays
    updateModeDisplays() {
        // Update UI based on active mode
        Object.entries(this.modes).forEach(([modeName, mode]) => {
            if (mode.active) {
                this.updateModeDisplay(modeName, mode);
            }
        });
    }
    
    // Update specific mode display
    updateModeDisplay(modeName, mode) {
        switch (modeName) {
            case 'chordIdentification':
                if (mode.waitingForAnswer && mode.currentChord) {
                    // Show chord identification interface
                    console.log(`Identify this chord: ${mode.currentChord.name}`);
                }
                break;
                
            case 'scaleExercises':
                if (mode.currentScale) {
                    console.log(`Practice scale: ${mode.currentScale.root} ${mode.currentScale.type}`);
                }
                break;
                
            case 'intervalTraining':
                if (mode.waitingForAnswer && mode.currentInterval) {
                    console.log(`Identify interval: ${mode.currentInterval.name}`);
                }
                break;
        }
    }
    
    // Show session summary
    showSessionSummary() {
        const duration = this.session.endTime - this.session.startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        
        const summary = {
            duration: `${minutes}m ${seconds}s`,
            totalAnswers: this.session.correctAnswers + this.session.wrongAnswers,
            accuracy: this.session.correctAnswers + this.session.wrongAnswers > 0 
                ? Math.round((this.session.correctAnswers / (this.session.correctAnswers + this.session.wrongAnswers)) * 100)
                : 0,
            notesPlayed: this.session.totalNotes,
            chordsPlayed: this.session.totalChords
        };
        
        console.log('Session Summary:', summary);
        this.showFeedback(`Session complete! Accuracy: ${summary.accuracy}%`, 'success');
    }
    
    // Get practice recommendations
    getRecommendations() {
        const recommendations = [];
        
        // Recommend practicing weak chords
        const weakChords = Object.entries(this.stats.weakChords)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
            
        if (weakChords.length > 0) {
            recommendations.push({
                type: 'weakness',
                message: `Practice these chords: ${weakChords.map(([chord]) => chord).join(', ')}`,
                chords: weakChords.map(([chord]) => chord)
            });
        }
        
        // Recommend based on accuracy
        if (this.stats.accuracy < 70) {
            recommendations.push({
                type: 'accuracy',
                message: 'Consider slowing down and focusing on accuracy over speed',
                action: 'slow-practice'
            });
        }
        
        // Recommend based on practice time
        const avgSessionTime = this.stats.totalPracticeTime / (this.stats.sessionsCompleted || 1);
        if (avgSessionTime < 300000) { // Less than 5 minutes
            recommendations.push({
                type: 'duration',
                message: 'Try longer practice sessions (5-10 minutes) for better results',
                action: 'longer-sessions'
            });
        }
        
        return recommendations;
    }
    
    // Progress tracking
    trackNotePress(note, octave) {
        this.session.totalNotes++;
        this.stats.notesPlayed++;
    }
    
    trackChordPlay(chord) {
        this.session.totalChords++;
        this.stats.chordsPlayed++;
        
        // Update chord statistics
        const chordName = chord.name;
        this.stats.favoriteChords[chordName] = (this.stats.favoriteChords[chordName] || 0) + 1;
    }
    
    // Data persistence
    saveStats() {
        try {
            localStorage.setItem('pianoAppStats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Failed to save practice stats:', error);
        }
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('pianoAppStats');
            if (saved) {
                this.stats = { ...this.stats, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Failed to load practice stats:', error);
        }
    }
    
    // Export practice data
    exportStats() {
        const dataStr = JSON.stringify(this.stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'piano-practice-stats.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    // Reset all statistics
    resetStats() {
        if (confirm('Are you sure you want to reset all practice statistics?')) {
            this.stats = {
                sessionsCompleted: 0,
                totalPracticeTime: 0,
                notesPlayed: 0,
                chordsPlayed: 0,
                accuracy: 0,
                streaks: { current: 0, best: 0 },
                favoriteChords: {},
                weakChords: {},
                practiceHistory: []
            };
            this.saveStats();
            this.updateUI();
        }
    }
    
    // Get formatted statistics
    getFormattedStats() {
        const totalHours = Math.floor(this.stats.totalPracticeTime / 3600000);
        const totalMinutes = Math.floor((this.stats.totalPracticeTime % 3600000) / 60000);
        
        return {
            sessions: this.stats.sessionsCompleted,
            practiceTime: `${totalHours}h ${totalMinutes}m`,
            notesPlayed: this.stats.notesPlayed.toLocaleString(),
            chordsPlayed: this.stats.chordsPlayed.toLocaleString(),
            accuracy: `${this.stats.accuracy.toFixed(1)}%`,
            bestStreak: this.stats.streaks.best,
            favoriteChord: this.getMostPlayedChord(this.stats.favoriteChords),
            weakestChord: this.getMostPlayedChord(this.stats.weakChords)
        };
    }
    
    // Get most played chord
    getMostPlayedChord(chordObj) {
        const entries = Object.entries(chordObj);
        if (entries.length === 0) return 'None';
        
        return entries.sort(([,a], [,b]) => b - a)[0][0];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PracticeTools;
} else {
    window.PracticeTools = PracticeTools;
}
