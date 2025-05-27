/**
 * Main Application Controller
 * Coordinates all modules and manages global state
 */

class TuneLearnApp {
    constructor() {
        this.isInitialized = false;
        this.currentTheme = localStorage.getItem('tunelearn-theme') || 'light';
        this.settings = this.loadSettings();
        
        // Module instances
        this.audioEngine = null;
        this.midiHandler = null;
        this.piano = null;
        this.chordDetector = null;
        this.practiceTools = null;
        this.exerciseEngine = null;
        
        // Current state
        this.currentScale = null;
        this.currentRootNote = 'C';
        this.currentChord = null;
        this.activeNotes = new Set();
        this.scaleLockEnabled = false;
        this.currentMode = 'free-play'; // 'free-play' or 'training'
        this.userPerformanceInput = [];
    }

    async init() {
        try {
            console.log('Initializing TuneLearn App...');
            
            // Initialize theme
            this.applyTheme(this.currentTheme);
            
            // Initialize audio engine
            this.audioEngine = new AudioEngine();
            await this.audioEngine.init();
            
            // Initialize MIDI handler
            this.midiHandler = new MIDIHandler();
            await this.midiHandler.init();
            
            // Initialize piano keyboard
            this.piano = new PianoKeyboard('piano-keyboard', {
                startNote: 'C3',
                endNote: 'C6',
                showLabels: this.settings.showNoteLabels,
                onNoteOn: (note, velocity) => this.handleNoteOn(note, velocity),
                onNoteOff: (note) => this.handleNoteOff(note)
            });
            
            // Initialize chord detector
            this.chordDetector = new ChordDetector();
            
            // Initialize practice tools
            this.practiceTools = new PracticeTools();
            
            // Initialize exercise engine
            this.exerciseEngine = new ExerciseEngine(this.audioEngine, this.piano);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Connect MIDI to piano
            this.midiHandler.onNoteOn = (note, velocity) => {
                this.piano.pressKey(note);
                this.handleNoteOn(note, velocity);
            };
            
            this.midiHandler.onNoteOff = (note) => {
                this.piano.releaseKey(note);
                this.handleNoteOff(note);
            };
            
            // Load initial scale/chord libraries
            this.populateScaleSelector();
            this.populateChordLibrary();
            this.updateMidiDeviceList();
            
            // Restore user settings
            this.restoreSettings();
            
            // Initialize UI mode
            this.updateModeUI();
            
            this.isInitialized = true;
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize the application. Please refresh and try again.');
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Scale selector
        const scaleSelector = document.getElementById('scale-select');
        if (scaleSelector) {
            scaleSelector.addEventListener('change', (e) => this.selectScale(e.target.value));
        }

        // Root note selector
        const rootNoteSelector = document.getElementById('root-note');
        if (rootNoteSelector) {
            rootNoteSelector.addEventListener('change', (e) => this.selectRootNote(e.target.value));
        }

        // Scale lock toggle
        const scaleLockToggle = document.getElementById('scale-lock');
        if (scaleLockToggle) {
            scaleLockToggle.addEventListener('click', (e) => {
                this.scaleLockEnabled = !this.scaleLockEnabled;
                e.target.textContent = `Scale Lock: ${this.scaleLockEnabled ? 'ON' : 'OFF'}`;
                e.target.classList.toggle('active', this.scaleLockEnabled);
                this.updateScaleHighlight();
            });
        }

        // MIDI device selector
        const midiDevices = document.getElementById('midi-devices');
        if (midiDevices) {
            midiDevices.addEventListener('change', (e) => this.selectMidiDevice(e.target.value));
        }

        // Octave range selector
        const octaveRange = document.getElementById('octave-range');
        if (octaveRange) {
            octaveRange.addEventListener('change', (e) => this.changeOctaveRange(e.target.value));
        }

        // Practice tools
        const randomChordBtn = document.getElementById('random-chord');
        if (randomChordBtn) {
            randomChordBtn.addEventListener('click', () => this.generateRandomChord());
        }

        const metronomeToggle = document.getElementById('metronome-toggle');
        if (metronomeToggle) {
            metronomeToggle.addEventListener('click', () => this.toggleMetronome());
        }

        // Computer keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Chord category buttons
        const chordCategories = document.querySelectorAll('.chord-category');
        chordCategories.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectChordCategory(e.target.dataset.category));
        });

        // Mode switching
        const freePlayBtn = document.getElementById('free-play-mode');
        const trainingBtn = document.getElementById('exercise-mode');
        
        if (freePlayBtn) {
            freePlayBtn.addEventListener('click', () => this.switchToFreePlay());
        }
        
        if (trainingBtn) {
            trainingBtn.addEventListener('click', () => this.switchToTraining());
        }

        // Exercise controls
        const startExerciseBtn = document.getElementById('start-exercise');
        const nextExerciseBtn = document.getElementById('next-exercise');
        const checkAnswerBtn = document.getElementById('check-answer');
        
        if (startExerciseBtn) {
            startExerciseBtn.addEventListener('click', () => this.startExercise());
        }
        
        if (nextExerciseBtn) {
            nextExerciseBtn.addEventListener('click', () => this.nextExercise());
        }
        
        if (checkAnswerBtn) {
            checkAnswerBtn.addEventListener('click', () => this.checkAnswer());
        }
    }

    handleNoteOn(note, velocity = 0.8) {
        if (this.scaleLockEnabled && this.currentScale) {
            const noteClass = note.replace(/\d+/, '');
            if (!this.isNoteInCurrentScale(noteClass)) {
                return; // Don't play notes outside the scale when scale lock is enabled
            }
        }

        this.activeNotes.add(note);
        
        // Capture performance input if in training mode and relevant exercise is active
        if (this.currentMode === 'training' && 
            this.exerciseEngine && 
            this.exerciseEngine.isActive &&
            this.exerciseEngine.currentExercise && 
            (this.exerciseEngine.currentExercise === 'scale-practice' || this.exerciseEngine.currentExercise === 'chord-building')) {
            
            this.userPerformanceInput.push(note); 
            console.log('Collected note for performance: ', note, this.userPerformanceInput); // For debugging
        }
        
        // Parse note name and octave
        const noteMatch = note.match(/^([A-G]#?)(\d+)$/);
        if (noteMatch) {
            const noteName = noteMatch[1];
            const octave = parseInt(noteMatch[2]);
            this.audioEngine.playNote(noteName, octave, velocity);
        }
        
        this.updateChordDetection();
        this.updateInfoPanel();
    }

    handleNoteOff(note) {
        this.activeNotes.delete(note);
        this.audioEngine.stopNote(note);
        this.updateChordDetection();
        this.updateInfoPanel();
    }

    updateChordDetection() {
        const noteArray = Array.from(this.activeNotes);
        if (noteArray.length >= 2) {
            const detectedChord = this.chordDetector.analyzeChord(noteArray);
            if (detectedChord) {
                this.displayChordInfo(detectedChord);
            } else {
                this.clearChordInfo();
            }
        } else {
            this.clearChordInfo();
        }
    }

    displayChordInfo(chord) {
        const chordDisplay = document.getElementById('chord-display');
        if (chordDisplay) {
            chordDisplay.textContent = chord.name || 'Unknown Chord';
        }
    }

    clearChordInfo() {
        const chordDisplay = document.getElementById('chord-display');
        if (chordDisplay) {
            chordDisplay.textContent = 'Play some notes...';
        }
    }

    selectScale(scaleName) {
        if (!scaleName) {
            this.currentScale = null;
            this.clearScaleHighlight();
            return;
        }

        this.currentScale = {
            name: scaleName,
            notes: MusicTheory.getScale(this.currentRootNote, scaleName)
        };

        this.updateScaleHighlight();
        this.updateScaleNotesDisplay();
    }

    selectRootNote(rootNote) {
        this.currentRootNote = rootNote;
        if (this.currentScale) {
            this.currentScale.notes = MusicTheory.getScale(rootNote, this.currentScale.name);
            this.updateScaleHighlight();
            this.updateScaleNotesDisplay();
        }
    }

    updateScaleHighlight() {
        if (this.currentScale && this.piano) {
            this.piano.highlightScale(this.currentScale.notes);
            if (this.scaleLockEnabled) {
                this.piano.setScaleLock(this.currentScale.notes);
            }
        } else {
            this.clearScaleHighlight();
        }
    }

    clearScaleHighlight() {
        if (this.piano) {
            this.piano.clearHighlight();
            this.piano.setScaleLock(null);
        }
    }

    updateScaleNotesDisplay() {
        const scaleNotesEl = document.getElementById('scale-notes');
        if (scaleNotesEl && this.currentScale) {
            scaleNotesEl.textContent = this.currentScale.notes.join(', ');
        } else if (scaleNotesEl) {
            scaleNotesEl.textContent = 'Select a scale...';
        }
    }

    isNoteInCurrentScale(noteClass) {
        if (!this.currentScale) return true;
        return this.currentScale.notes.includes(noteClass);
    }

    populateScaleSelector() {
        const scaleSelector = document.getElementById('scale-select');
        if (!scaleSelector) return;

        // Scale options are already in the HTML
    }

    populateChordLibrary() {
        const chordButtons = document.getElementById('chord-buttons');
        if (!chordButtons) return;

        this.selectChordCategory('triads'); // Default to triads
    }

    selectChordCategory(category) {
        // Update active category button
        document.querySelectorAll('.chord-category').forEach(btn => {
            btn.classList.remove('active');
        });
        const categoryBtn = document.querySelector(`[data-category="${category}"]`);
        if (categoryBtn) {
            categoryBtn.classList.add('active');
        }

        // Update chord buttons
        const chordButtons = document.getElementById('chord-buttons');
        chordButtons.innerHTML = '';

        const chords = this.getChordsByCategory(category);
        chords.forEach(chord => {
            const button = document.createElement('button');
            button.className = 'chord-btn';
            button.textContent = chord.name;
            button.addEventListener('click', () => this.playChord(chord));
            chordButtons.appendChild(button);
        });
    }

    getChordsByCategory(category) {
        const chordLibrary = {
            triads: [
                { name: 'Major', formula: [0, 4, 7] },
                { name: 'Minor', formula: [0, 3, 7] },
                { name: 'Diminished', formula: [0, 3, 6] },
                { name: 'Augmented', formula: [0, 4, 8] }
            ],
            sevenths: [
                { name: 'Major 7th', formula: [0, 4, 7, 11] },
                { name: 'Minor 7th', formula: [0, 3, 7, 10] },
                { name: 'Dominant 7th', formula: [0, 4, 7, 10] },
                { name: 'Half-Dim 7th', formula: [0, 3, 6, 10] }
            ],
            extended: [
                { name: 'Major 9th', formula: [0, 4, 7, 11, 14] },
                { name: 'Minor 9th', formula: [0, 3, 7, 10, 14] },
                { name: 'Major 6th', formula: [0, 4, 7, 9] },
                { name: 'Minor 6th', formula: [0, 3, 7, 9] }
            ],
            sus: [
                { name: 'Sus2', formula: [0, 2, 7] },
                { name: 'Sus4', formula: [0, 5, 7] },
                { name: '7sus2', formula: [0, 2, 7, 10] },
                { name: '7sus4', formula: [0, 5, 7, 10] }
            ]
        };

        return chordLibrary[category] || [];
    }

    playChord(chord) {
        // Get root note and build chord
        const rootNote = this.currentRootNote + '4'; // Default octave
        const chordNotes = this.buildChordNotes(rootNote, chord.formula);
        
        // Play all notes
        chordNotes.forEach((note, index) => {
            setTimeout(() => {
                this.audioEngine.playNote(note, 0.7);
                this.piano.pressKey(note);
                
                // Release after a short time
                setTimeout(() => {
                    this.piano.releaseKey(note);
                }, 1000);
            }, index * 50); // Slight stagger
        });
    }

    buildChordNotes(rootNote, formula) {
        const rootMidi = this.noteToMidi(rootNote);
        return formula.map(interval => this.midiToNote(rootMidi + interval));
    }

    noteToMidi(note) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const noteClass = note.slice(0, -1);
        const noteIndex = notes.indexOf(noteClass);
        return (octave + 1) * 12 + noteIndex;
    }

    midiToNote(midiNote) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteIndex = midiNote % 12;
        return notes[noteIndex] + octave;
    }

    generateRandomChord() {
        const categories = ['triads', 'sevenths', 'extended', 'sus'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const chords = this.getChordsByCategory(randomCategory);
        const randomChord = chords[Math.floor(Math.random() * chords.length)];
        
        // Update display
        const chordDisplay = document.getElementById('chord-display');
        if (chordDisplay) {
            chordDisplay.textContent = `Practice: ${this.currentRootNote} ${randomChord.name}`;
        }
        
        this.playChord(randomChord);
    }

    toggleMetronome() {
        const button = document.getElementById('metronome-toggle');
        if (this.practiceTools.metronomeRunning) {
            this.practiceTools.stopMetronome();
            button.textContent = 'Metronome: OFF';
        } else {
            this.practiceTools.startMetronome();
            button.textContent = 'Metronome: ON';
        }
    }

    handleKeyDown(e) {
        if (e.repeat) return;
        
        const note = this.getKeyMapping(e.key);
        if (note && !this.activeNotes.has(note)) {
            this.piano.pressKey(note);
            this.handleNoteOn(note, 0.8);
        }
    }

    handleKeyUp(e) {
        const note = this.getKeyMapping(e.key);
        if (note) {
            this.piano.releaseKey(note);
            this.handleNoteOff(note);
        }
    }

    getKeyMapping(key) {
        const keyMap = {
            '1': 'C4', '!': 'C#4',
            '2': 'D4', '@': 'D#4',
            '3': 'E4',
            '4': 'F4', '$': 'F#4',
            '5': 'G4', '%': 'G#4',
            '6': 'A4', '^': 'A#4',
            '7': 'B4'
        };
        return keyMap[key];
    }

    updateMidiDeviceList() {
        const select = document.getElementById('midi-devices');
        if (!select || !this.midiHandler || !this.midiHandler.isEnabled) return;

        // Clear current options except the first one
        const firstOption = select.firstElementChild;
        select.innerHTML = '';
        select.appendChild(firstOption);

        // Add connected devices
        if (this.midiHandler.connectedDevices && this.midiHandler.connectedDevices.size > 0) {
            firstOption.textContent = 'Select MIDI device...';
            this.midiHandler.connectedDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.port.id;
                option.textContent = device.name;
                select.appendChild(option);
            });
        } else {
            firstOption.textContent = 'No MIDI devices found';
        }
    }

    selectMidiDevice(deviceId) {
        if (this.midiHandler && deviceId && this.midiHandler.setActiveDevice) {
            this.midiHandler.setActiveDevice(deviceId);
        }
    }

    changeOctaveRange(range) {
        const [start, end] = range.split('-');
        if (this.piano && this.piano.setRange) {
            this.piano.setRange(start, end);
        }
    }

    updateInfoPanel() {
        const pressedKeysEl = document.getElementById('pressed-keys');
        if (pressedKeysEl) {
            if (this.activeNotes.size > 0) {
                const noteList = Array.from(this.activeNotes).join(', ');
                pressedKeysEl.textContent = noteList;
            } else {
                pressedKeysEl.textContent = 'None';
            }
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('tunelearn-theme', this.currentTheme);
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem('tunelearn-settings');
            return stored ? JSON.parse(stored) : this.getDefaultSettings();
        } catch (error) {
            console.warn('Failed to load settings, using defaults');
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            volume: 0.7,
            showNoteLabels: true,
            velocitySensitive: true
        };
    }

    saveSettings() {
        try {
            localStorage.setItem('tunelearn-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings');
        }
    }

    restoreSettings() {
        // Apply saved settings to UI elements
        this.applyTheme(this.currentTheme);
    }

    showError(message) {
        console.error(message);
        
        // Create error notification
        const errorEl = document.createElement('div');
        errorEl.className = 'error-notification';
        errorEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-family: Inter, sans-serif;
            font-size: 14px;
            max-width: 300px;
        `;
        errorEl.textContent = message;
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.remove();
            }
        }, 5000);
    }

    // Mode switching and exercise controls
    switchToFreePlay() {
        this.currentMode = 'free-play';
        document.body.classList.remove('performance-exercise-active');
        this.updateModeUI();
    }

    switchToTraining() {
        this.currentMode = 'training';
        this.updateModeUI();
    }

    updateModeUI() {
        const freePlayBtn = document.getElementById('free-play-mode');
        const trainingBtn = document.getElementById('exercise-mode');
        const controlPanel = document.querySelector('.control-panel');
        const infoPanel = document.querySelector('.info-panel');
        const chordLibrary = document.querySelector('.chord-library');
        const practiceTools = document.querySelector('.practice-tools');
        const exercisePanel = document.getElementById('exercise-panel');

        if (freePlayBtn && trainingBtn) {
            freePlayBtn.classList.toggle('active', this.currentMode === 'free-play');
            trainingBtn.classList.toggle('active', this.currentMode === 'training');
        }

        if (this.currentMode === 'free-play') {
            // Show free play elements
            if (controlPanel) controlPanel.style.display = 'block';
            if (infoPanel) infoPanel.style.display = 'block';
            if (chordLibrary) chordLibrary.style.display = 'block';
            if (practiceTools) practiceTools.style.display = 'block';
            if (exercisePanel) exercisePanel.style.display = 'none';
        } else {
            // Show training elements
            if (controlPanel) controlPanel.style.display = 'none';
            if (infoPanel) infoPanel.style.display = 'none';
            if (chordLibrary) chordLibrary.style.display = 'none';
            if (practiceTools) practiceTools.style.display = 'none';
            if (exercisePanel) exercisePanel.style.display = 'block';
            
            // If switching to training mode and no exercise is active, show the start screen
            if (this.exerciseEngine && !this.exerciseEngine.currentExercise) {
                this.showExerciseStartScreen();
            }
        }
    }

    showExerciseStartScreen() {
        const exercisePanel = document.getElementById('exercise-panel');
        if (!exercisePanel || !this.exerciseEngine) return;

        document.body.classList.remove('performance-exercise-active'); // Remove focus mode on start screen

        const level = this.exerciseEngine.getCurrentLevel();
        const sessionStats = this.exerciseEngine.getSessionStats();
        const levelData = this.exerciseEngine.getCurrentLevelData();

        exercisePanel.innerHTML = `
            <div class="exercise-start">
                <h3>🎵 Piano Training</h3>
                ${levelData ? `
                    <p class="current-level-display">Current Level: ${level} - ${levelData.name}</p>
                    <p>Progress for this level: ${sessionStats.exercisesCompleted} / ${levelData.minExercises || 'N/A'} exercises.</p>
                    <p>Required accuracy for this level: ${(levelData.requiredAccuracy * 100).toFixed(0)}%</p>
                ` : '<p>Loading level data...</p>'}
                <p>Overall exercises completed this session: ${sessionStats.exercisesCompleted}</p>
                <button id="start-exercise" class="btn btn-primary">Start Training</button>
                ${ level > 1 ? '<button id="reset-progress-btn" class="btn btn-secondary" style="margin-top: 10px;">Reset Progress to Level 1</button>' : ''}
            </div>
        `;

        const startBtn = document.getElementById('start-exercise');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startExercise());
        }

        const resetBtn = document.getElementById('reset-progress-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.confirmResetProgress());
        }
    }

    confirmResetProgress() {
        if (confirm("Are you sure you want to reset all your progress to Level 1? This cannot be undone.")) {
            this.resetProgress();
        }
    }

    resetProgress() {
        if (this.exerciseEngine) {
            this.exerciseEngine.resetProgressToLevel1();
            this.showExerciseStartScreen(); // Refresh start screen
            this.showFeedback("Your progress has been reset to Level 1.", "info");
        }
    }

    startExercise() {
        if (!this.exerciseEngine) return;

        if (this.piano) { // Ensure piano is initialized
            this.piano.clearAllKeyColorizations();
        }
        this.userPerformanceInput = []; // Reset performance input

        const success = this.exerciseEngine.startExercise();
        if (success) {
            this.renderCurrentExercise(); // Render after exercise engine has started
        } else {
            this.showFeedback('Failed to start exercise. Please try again.', 'error');
        }
    }

    renderCurrentExercise() {
        const exercisePanel = document.getElementById('exercise-panel');
        if (!exercisePanel || !this.exerciseEngine.currentExercise) return;

        // Focus Mode: Add or remove class based on exercise type
        if (this.exerciseEngine.currentExercise === 'scale-practice' || this.exerciseEngine.currentExercise === 'chord-building') {
            document.body.classList.add('performance-exercise-active');
        } else {
            document.body.classList.remove('performance-exercise-active');
        }

        const exerciseConfig = this.exerciseEngine.exerciseTypes.get(this.exerciseEngine.currentExercise);
        const levelData = this.exerciseEngine.getCurrentLevelData();
        const sessionStats = this.exerciseEngine.getSessionStats();
        
        exercisePanel.innerHTML = `
            <div class="exercise-header">
                <h3>${exerciseConfig ? exerciseConfig.name : 'Exercise'}</h3>
                ${levelData ? `
                    <div class="exercise-level-info">Level ${this.exerciseEngine.currentLevel}: ${levelData.name}</div>
                    <div class="exercise-session-progress">
                        Level Progress: ${sessionStats.exercisesCompleted} / ${levelData.minExercises || 'N/A'} exercises
                    </div>
                ` : ''}
            </div>
            <div class="exercise-content">
                ${this.renderExerciseContent()}
            </div>
            ${this.exerciseEngine.exerciseData && this.exerciseEngine.exerciseData.theorySnippet ? `
            <div class="theory-snippet">
                <strong>💡 Tip:</strong> ${this.exerciseEngine.exerciseData.theorySnippet}
            </div>
            ` : ''}
            <div class="exercise-controls">
                ${ (this.exerciseEngine.currentExercise === 'scale-practice' || this.exerciseEngine.currentExercise === 'chord-building') ?
                    '<button id="submit-performance-btn" class="btn btn-primary">Submit Attempt</button>' :
                    '<button id="check-answer" class="btn btn-primary" style="display: none;">Check Answer</button>'
                }
                <button id="next-exercise" class="btn btn-secondary" style="display: none;">Next Exercise</button>
            </div>
            <div class="session-stats-display">
                <h4>Session Stats</h4>
                <p>Accuracy: ${(sessionStats.accuracy * 100).toFixed(1)}%</p>
                <p>Correct: ${sessionStats.correctAnswers}</p>
                <p>Attempts: ${sessionStats.totalAttempts}</p>
                <p>Total Completed: ${sessionStats.exercisesCompleted}</p>
            </div>
        `;
        
        // Re-attach event listeners
        const nextExerciseBtn = document.getElementById('next-exercise');
        if (nextExerciseBtn) {
            nextExerciseBtn.addEventListener('click', () => this.nextExercise());
        }

        const submitPerformanceBtn = document.getElementById('submit-performance-btn');
        if (submitPerformanceBtn) {
            submitPerformanceBtn.addEventListener('click', () => this.submitPerformanceAnswer());
        }

        const checkAnswerBtn = document.getElementById('check-answer');
        if (checkAnswerBtn) {
            checkAnswerBtn.addEventListener('click', () => this.checkAnswer());
            // Initial state of checkAnswerBtn for MCQs (hidden until an option is picked)
             if (!(this.exerciseEngine.currentExercise === 'scale-practice' || this.exerciseEngine.currentExercise === 'chord-building')) {
                checkAnswerBtn.style.display = 'none';
            }
        }
        
        // Attach event listeners for multiple-choice answer buttons if they exist
        const exerciseAnswerButtons = exercisePanel.querySelectorAll('.answer-btn');
        if (exerciseAnswerButtons.length > 0) {
            exerciseAnswerButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    exerciseAnswerButtons.forEach(b => b.classList.remove('selected'));
                    e.target.classList.add('selected');
                    if (checkAnswerBtn) { // Show check answer button for MCQs
                        checkAnswerBtn.style.display = 'inline-block';
                    }
                });
            });
        }

        // Auto-play audio for listening exercises using the new handler
        if (this.exerciseEngine.exerciseData && this.exerciseEngine.exerciseData.audioPlayback) {
            setTimeout(() => this.handlePlayExerciseAudio(), 500);
        }

        const playAudioBtn = document.getElementById('play-exercise-audio-btn');
        if (playAudioBtn) {
            playAudioBtn.addEventListener('click', () => this.handlePlayExerciseAudio());
        }
    }

    renderExerciseContent() {
        const exerciseData = this.exerciseEngine.exerciseData;
        if (!exerciseData) {
            return '<p>Loading exercise...</p>';
        }

        let contentHtml = '';

        switch (this.exerciseEngine.currentExercise) {
            case 'note-identification':
                contentHtml = `
                    <div class="exercise-question">
                        <p>${exerciseData.question}</p>
                        <button id="play-exercise-audio-btn" class="btn btn-primary">
                            🔊 Play Again
                        </button>
                    </div>
                    <div class="exercise-answers">
                        ${this.generateNoteOptions(exerciseData.correctAnswer).map(option => 
                            `<button class="answer-btn btn">${option}</button>`
                        ).join('')}
                    </div>
                `;
                break;
                
            case 'interval-identification':
                contentHtml = `
                    <div class="exercise-question">
                        <p>${exerciseData.question}</p>
                        <button id="play-exercise-audio-btn" class="btn btn-primary">
                            🔊 Play Again
                        </button>
                    </div>
                    <div class="exercise-answers">
                        ${this.generateIntervalOptions(exerciseData.correctAnswer).map(option => 
                            `<button class="answer-btn btn">${option}</button>`
                        ).join('')}
                    </div>
                `;
                break;
                
            case 'chord-identification':
                contentHtml = `
                    <div class="exercise-question">
                        <p>${exerciseData.question}</p>
                        <button id="play-exercise-audio-btn" class="btn btn-primary">
                            🔊 Play Again
                        </button>
                    </div>
                    <div class="exercise-answers">
                        ${this.generateChordOptions(exerciseData.correctAnswer).map(option => 
                            `<button class="answer-btn btn">${option}</button>`
                        ).join('')}
                    </div>
                `;
                break;
                
            case 'scale-practice':
                contentHtml = `
                    <div class="exercise-question">
                        <p>${exerciseData.instruction}</p>
                        <p class="instruction-detail">Use your MIDI keyboard or click the piano keys. Notes will be validated as you play.</p>
                    </div>
                    <div id="performance-feedback" class="performance-feedback"></div>
                `;
                break;
                
            case 'chord-building':
                contentHtml = `
                    <div class="exercise-question">
                        <p>${exerciseData.instruction}</p>
                        <p class="instruction-detail">Use your MIDI keyboard or click the piano keys. Notes will be validated when you indicate completion.</p>
                    </div>
                    <div id="performance-feedback" class="performance-feedback"></div>
                `;
                break;
                
            default:
                contentHtml = `<p>Unknown exercise type or content not implemented yet.</p>`;
        }
        return contentHtml;
    }

    generateNoteOptions(correctAnswer) {
        const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const options = [correctAnswer];
        
        // Add 3 random incorrect options
        while (options.length < 4) {
            const randomNote = allNotes[Math.floor(Math.random() * allNotes.length)];
            if (!options.includes(randomNote)) {
                options.push(randomNote);
            }
        }
        
        // Shuffle the options
        return this.shuffleArray(options);
    }

    generateIntervalOptions(correctAnswer) {
        const allIntervals = [
            'Perfect Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd',
            'Perfect 4th', 'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th',
            'Major 7th', 'Perfect Octave'
        ];
        
        const options = [correctAnswer];
        
        // Add 3 random incorrect options
        while (options.length < 4) {
            const randomInterval = allIntervals[Math.floor(Math.random() * allIntervals.length)];
            if (!options.includes(randomInterval)) {
                options.push(randomInterval);
            }
        }
        
        return this.shuffleArray(options);
    }

    generateChordOptions(correctAnswer) {
        const allChords = [
            'Major', 'Minor', 'Diminished', 'Augmented', 'Major 7th', 'Minor 7th',
            'Dominant 7th', 'Diminished 7th', 'Sus2', 'Sus4'
        ];
        
        const options = [correctAnswer];
        
        // Add 3 random incorrect options
        while (options.length < 4) {
            const randomChord = allChords[Math.floor(Math.random() * allChords.length)];
            if (!options.includes(randomChord)) {
                options.push(randomChord);
            }
        }
        
        return this.shuffleArray(options);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    renderExercise(exercise) {
        const exerciseContent = document.getElementById('exercise-content');
        if (!exerciseContent) return;

        exerciseContent.innerHTML = exercise.render();

        // Attach event listeners for answer buttons
        const answerButtons = exerciseContent.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove previous selections
                answerButtons.forEach(b => b.classList.remove('selected'));
                // Mark this button as selected
                e.target.classList.add('selected');
            });
        });

        // Show check answer button
        const checkAnswerBtn = document.getElementById('check-answer');
        if (checkAnswerBtn) {
            checkAnswerBtn.style.display = 'inline-block';
        }

        // Update progress display
        this.updateExerciseProgress();
    }

    checkAnswer() {
        if (!this.exerciseEngine || !this.exerciseEngine.currentExercise) return;

        const exerciseContent = document.querySelector('#exercise-panel .exercise-content');
        const selectedBtn = exerciseContent.querySelector('.answer-btn.selected');

        if (!selectedBtn) {
            this.showFeedback('Please select an answer first!', 'warning');
            return;
        }

        const selectedAnswer = selectedBtn.textContent.trim();
        const feedback = this.exerciseEngine.submitAnswer(selectedAnswer);

        this.showFeedback(feedback.message, feedback.isCorrect ? 'success' : 'error');

        // Disable answer buttons after submission
        const answerButtons = exerciseContent.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => {
            btn.disabled = true;
            // Highlight the correct answer if the user was wrong and details are available
            if (!feedback.isCorrect && feedback.correctAnswerDetails && btn.textContent.trim() === feedback.correctAnswerDetails) {
                btn.classList.add('correct-answer'); 
            }
        });

        // Hide check answer button and show next exercise button
        const checkAnswerBtn = document.getElementById('check-answer');
        if (checkAnswerBtn) {
            checkAnswerBtn.disabled = true; 
        }
        const nextExerciseBtn = document.getElementById('next-exercise');
        if (nextExerciseBtn) {
            nextExerciseBtn.style.display = 'inline-block';
        }
        
        // No automatic nextExercise call, user clicks the button.
    }

    submitPerformanceAnswer() {
        if (!this.exerciseEngine || !this.exerciseEngine.isActive) {
            console.warn('Cannot submit performance, exercise engine not active.');
            return;
        }

        // Prevent submission if no notes were played
        if (this.userPerformanceInput.length === 0) {
            this.showFeedback('Please play some notes before submitting!', 'warning');
            return;
        }

        console.log('Submitting performance input:', this.userPerformanceInput);
        
        // Call the exercise engine's submitAnswer with the array of notes.
        const feedback = this.exerciseEngine.submitAnswer(this.userPerformanceInput); 

        if (feedback.playedNotes && feedback.expectedNotes) {
            this.displayPerformanceVisualFeedback(feedback.playedNotes, feedback.expectedNotes);
        }
        this.showFeedback(feedback.message, feedback.isCorrect ? 'success' : 'error');
        
        // Disable the submit button
        const submitBtn = document.getElementById('submit-performance-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
        }

        // Show "Next Exercise" button
        const nextExerciseBtn = document.getElementById('next-exercise');
        if (nextExerciseBtn) {
            nextExerciseBtn.style.display = 'inline-block';
        }
        
        // No automatic nextExercise call, user clicks the button.
        // Visual feedback for performance exercises (e.g., highlighting notes on piano) will be in a future task.
    }

    displayPerformanceVisualFeedback(playedNotes, expectedNotes) {
        if (!this.piano) return;

        this.piano.clearAllKeyColorizations(); // Clear previous attempt's feedback first

        const playedSet = new Set(playedNotes);
        const expectedSet = new Set(expectedNotes);
        const allNotesInvolved = new Set([...playedNotes, ...expectedNotes]);

        allNotesInvolved.forEach(note => {
            const isPlayed = playedSet.has(note);
            const isExpected = expectedSet.has(note);

            if (isPlayed && isExpected) {
                this.piano.colorizeKey(note, 'user-played-correct');
            } else if (isPlayed && !isExpected) {
                this.piano.colorizeKey(note, 'user-played-incorrect');
            } else if (!isPlayed && isExpected) {
                this.piano.colorizeKey(note, 'expected-missed');
            }
        });
    }

    showExerciseResult(result) {
        const exerciseContent = document.getElementById('exercise-content');
        const resultDiv = document.createElement('div');
        resultDiv.className = `exercise-result ${result.correct ? 'correct' : 'incorrect'}`;
        
        resultDiv.innerHTML = `
            <div class="result-icon">${result.correct ? '✅' : '❌'}</div>
            <div class="result-text">
                <strong>${result.correct ? 'Correct!' : 'Incorrect'}</strong>
                ${result.feedback ? `<p>${result.feedback}</p>` : ''}
            </div>
        `;

        exerciseContent.appendChild(resultDiv);

        // Disable answer buttons
        const answerButtons = exerciseContent.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.trim() === result.correctAnswer) {
                btn.classList.add('correct-answer');
            }
        });
    }

    nextExercise() {
        const nextExerciseBtn = document.getElementById('next-exercise');
        if (nextExerciseBtn) {
            nextExerciseBtn.style.display = 'none';
        }

        if (this.exerciseEngine) {
            const levelUpData = this.exerciseEngine.nextExercise(); // This now returns notification or null
            
            if (levelUpData && levelUpData.isLevelUp) {
               this.showModalNotification(levelUpData.message, "Level Up!");
            }

            if (this.exerciseEngine.currentExercise) { // If a new exercise was successfully started
                this.renderCurrentExercise(); 
            } else {
                // Handle case where no more exercises or curriculum ends
                this.showExerciseStartScreen(); 
                this.showFeedback("🎉 Congratulations! You've completed all available exercises for now.", "success");
            }
        }
    }

    showModalNotification(message, title = "Notification") {
        // Remove any existing modal first
        const existingModal = document.getElementById('app-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const overlay = document.createElement('div');
        overlay.id = 'app-modal-overlay';
        overlay.className = 'modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'modal-content';

        modal.innerHTML = `
            <h2 class="modal-title">${title}</h2>
            <p class="modal-message">${message}</p>
            <button id="modal-close-btn" class="btn btn-primary">Continue</button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('modal-close-btn').addEventListener('click', () => {
            overlay.remove();
        });

        // Optional: close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    handlePlayExerciseAudio() {
        if (!this.audioEngine) {
            console.error("AudioEngine not available.");
            return;
        }
        if (!this.exerciseEngine || !this.exerciseEngine.exerciseData || !this.exerciseEngine.exerciseData.audioPlayback) {
            console.warn("No audio playback data available for this exercise.");
            return;
        }

        const audioData = this.exerciseEngine.exerciseData.audioPlayback;

        switch (audioData.type) {
            case 'note':
                if (audioData.noteName && typeof audioData.octave !== 'undefined') {
                    this.audioEngine.playNote(audioData.noteName, audioData.octave, 0.8, 1.5); // Duration 1.5s
                } else {
                    console.error("Missing data for note playback:", audioData);
                }
                break;
            case 'interval':
                if (audioData.rootName && typeof audioData.rootOctave !== 'undefined' && typeof audioData.intervalSemitones !== 'undefined') {
                    this.audioEngine.playNote(audioData.rootName, audioData.rootOctave, 0.8, 1); // Duration 1s
                    setTimeout(() => {
                        const rootMidiVal = MusicTheory.noteToMidi(audioData.rootName, audioData.rootOctave);
                        if (rootMidiVal === null) {
                             console.error("Invalid root note for interval playback:", audioData); return;
                        }
                        const targetMidi = rootMidiVal + audioData.intervalSemitones;
                        const targetNoteFull = MusicTheory.midiToNote(targetMidi);
                        this.audioEngine.playNote(targetNoteFull.note, targetNoteFull.octave, 0.8, 1); // Duration 1s
                    }, 800); // Delay between notes (e.g., 800ms)
                } else {
                    console.error("Missing data for interval playback:", audioData);
                }
                break;
            case 'chord':
                if (audioData.rootName && typeof audioData.rootOctave !== 'undefined' && Array.isArray(audioData.intervals)) {
                    const rootMidiVal = MusicTheory.noteToMidi(audioData.rootName, audioData.rootOctave);
                    if (rootMidiVal === null) {
                         console.error("Invalid root note for chord playback:", audioData); return;
                    }
                    // Play chord notes with a slight stagger or simultaneously if AudioEngine supports it well
                    audioData.intervals.forEach((intervalSemitone, index) => {
                        setTimeout(() => {
                            const targetMidi = rootMidiVal + intervalSemitone;
                            const noteToPlay = MusicTheory.midiToNote(targetMidi);
                            this.audioEngine.playNote(noteToPlay.note, noteToPlay.octave, 0.6, 1.5); // Duration 1.5s
                        }, index * 50); // Stagger chord notes slightly
                    });
                } else {
                    console.error("Missing data for chord playback:", audioData);
                }
                break;
            default:
                console.warn("Unknown audio playback type:", audioData.type);
        }
    }

    showFeedback(message, type = 'info') {
        // Create or update feedback element
        let feedback = document.getElementById('exercise-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'exercise-feedback';
            const exercisePanel = document.getElementById('exercise-panel');
            if (exercisePanel) {
                exercisePanel.insertBefore(feedback, exercisePanel.firstChild);
            }
        }

        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        feedback.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 3000);
    }

    // ...existing code...
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new TuneLearnApp();
        await app.init();
        
        // Make app globally available for debugging
        window.app = app;
    } catch (error) {
        console.error('Failed to start application:', error);
        
        // Show user-friendly error message
        const errorEl = document.createElement('div');
        errorEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #ff4444;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Inter, sans-serif;
        `;
        errorEl.innerHTML = `
            <h3 style="color: #ff4444; margin: 0 0 15px 0;">⚠️ Initialization Error</h3>
            <p style="margin: 0 0 15px 0; color: #666;">
                Failed to initialize the MIDI keyboard application.<br>
                Please refresh the page and try again.
            </p>
            <button onclick="location.reload()" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">Refresh Page</button>
        `;
        document.body.appendChild(errorEl);
    }
});
