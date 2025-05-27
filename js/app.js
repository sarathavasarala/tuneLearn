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
            
            // Override the ExerciseEngine's displayExercise method to use our app's rendering
            this.exerciseEngine.displayExercise = () => {
                this.renderCurrentExercise();
            };
            
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

        if (exercisePanel) {
            exercisePanel.innerHTML = `
                <div class="exercise-start">
                    <h3>🎵 Piano Training</h3>
                    <p>Welcome to your piano practice session!</p>
                    <p>Current Level: ${this.exerciseEngine.currentLevel}</p>
                    <p>Progress: ${this.exerciseEngine.sessionStats.exercisesCompleted} exercises completed</p>
                    <button id="start-exercise" class="btn btn-primary">Start Training</button>
                </div>
            `;

            // Re-attach the event listener
            const startBtn = document.getElementById('start-exercise');
            if (startBtn) {
                startBtn.addEventListener('click', () => this.startExercise());
            }
        }
    }

    startExercise() {
        if (!this.exerciseEngine) return;

        const success = this.exerciseEngine.startExercise();
        if (success) {
            // Override the ExerciseEngine's display method to use our app structure
            this.renderCurrentExercise();
        } else {
            this.showFeedback('Failed to start exercise. Please try again.', 'error');
        }
    }

    renderCurrentExercise() {
        const exercisePanel = document.getElementById('exercise-panel');
        if (!exercisePanel || !this.exerciseEngine.currentExercise) return;

        const config = this.exerciseEngine.exerciseTypes.get(this.exerciseEngine.currentExercise);
        
        exercisePanel.innerHTML = `
            <div class="exercise-header">
                <h3>${config.name}</h3>
                <div class="exercise-progress">
                    Level ${this.exerciseEngine.currentLevel} | Exercise ${this.exerciseEngine.sessionStats.exercisesCompleted + 1}
                </div>
            </div>
            <div class="exercise-content">
                ${this.renderExerciseContent()}
            </div>
            <div class="exercise-controls">
                <button id="check-answer" class="btn btn-primary" style="display: none;">Check Answer</button>
                <button id="next-exercise" class="btn btn-secondary" style="display: none;">Next Exercise</button>
            </div>
            <div class="exercise-stats">
                Accuracy: ${(this.exerciseEngine.sessionStats.accuracy * 100).toFixed(1)}% | 
                Completed: ${this.exerciseEngine.sessionStats.exercisesCompleted}
            </div>
        `;
        
        // Re-attach event listeners
        const checkAnswerBtn = document.getElementById('check-answer');
        const nextExerciseBtn = document.getElementById('next-exercise');
        
        if (checkAnswerBtn) {
            checkAnswerBtn.addEventListener('click', () => this.checkAnswer());
        }
        
        if (nextExerciseBtn) {
            nextExerciseBtn.addEventListener('click', () => this.nextExercise());
        }

        // Attach event listeners for answer buttons
        const exerciseAnswerButtons = exercisePanel.querySelectorAll('.answer-btn');
        exerciseAnswerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove previous selections
                exerciseAnswerButtons.forEach(b => b.classList.remove('selected'));
                // Mark this button as selected
                e.target.classList.add('selected');
                
                // Show check answer button if this is a multiple choice exercise
                if (checkAnswerBtn) {
                    checkAnswerBtn.style.display = 'inline-block';
                }
            });
        });

        // Add event listeners for answer buttons
        const answerButtons = exercisePanel.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove previous selections
                answerButtons.forEach(b => b.classList.remove('selected'));
                // Mark this button as selected
                e.target.classList.add('selected');
                
                // Show check answer button when an answer is selected
                const checkBtn = document.getElementById('check-answer');
                if (checkBtn) {
                    checkBtn.style.display = 'inline-block';
                }
            });
        });

        // Auto-play audio for listening exercises
        if (this.exerciseEngine.exerciseData.playNote) {
            setTimeout(() => this.exerciseEngine.exerciseData.playNote(), 500);
        }
        if (this.exerciseEngine.exerciseData.playInterval) {
            setTimeout(() => this.exerciseEngine.exerciseData.playInterval(), 500);
        }
        if (this.exerciseEngine.exerciseData.playChord) {
            setTimeout(() => this.exerciseEngine.exerciseData.playChord(), 500);
        }
    }

    renderExerciseContent() {
        if (!this.exerciseEngine.exerciseData) {
            return '<p>Loading exercise...</p>';
        }

        switch (this.exerciseEngine.currentExercise) {
            case 'note-identification':
                return `
                    <div class="exercise-question">
                        <p>What note was played?</p>
                        <button onclick="app.exerciseEngine.exerciseData.playNote()" class="btn btn-primary">
                            🔊 Play Again
                        </button>
                    </div>
                    <div class="exercise-answers">
                        ${this.generateNoteOptions(this.exerciseEngine.exerciseData.correctAnswer).map(option => 
                            `<button class="answer-btn btn">${option}</button>`
                        ).join('')}
                    </div>
                `;
                
            case 'interval-identification':
                return `
                    <div class="exercise-question">
                        <p>What interval is being played?</p>
                        <button onclick="app.exerciseEngine.exerciseData.playInterval()" class="btn btn-primary">
                            🔊 Play Again
                        </button>
                    </div>
                    <div class="exercise-answers">
                        ${this.generateIntervalOptions(this.exerciseEngine.exerciseData.correctAnswer).map(option => 
                            `<button class="answer-btn btn">${option}</button>`
                        ).join('')}
                    </div>
                `;
                
            case 'chord-identification':
                return `
                    <div class="exercise-question">
                        <p>What chord is being played?</p>
                        <button onclick="app.exerciseEngine.exerciseData.playChord()" class="btn btn-primary">
                            🔊 Play Again
                        </button>
                    </div>
                    <div class="exercise-answers">
                        ${this.generateChordOptions(this.exerciseEngine.exerciseData.correctAnswer).map(option => 
                            `<button class="answer-btn btn">${option}</button>`
                        ).join('')}
                    </div>
                `;
                
            case 'scale-practice':
                return `
                    <div class="exercise-question">
                        <p>Play the ${this.exerciseEngine.exerciseData.scaleName} scale starting from ${this.exerciseEngine.exerciseData.rootNote}</p>
                        <p class="instruction">Use your MIDI keyboard or click the piano keys</p>
                    </div>
                `;
                
            case 'chord-building':
                return `
                    <div class="exercise-question">
                        <p>Build a ${this.exerciseEngine.exerciseData.chordName} chord starting from ${this.exerciseEngine.exerciseData.rootNote}</p>
                        <p class="instruction">Use your MIDI keyboard or click the piano keys</p>
                    </div>
                `;
                
            default:
                return '<p>Unknown exercise type</p>';
        }
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
        const isCorrect = this.exerciseEngine.submitAnswer(selectedAnswer);

        // Disable answer buttons after submission
        const answerButtons = exerciseContent.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.trim() === this.exerciseEngine.exerciseData.correctAnswer) {
                btn.classList.add('correct-answer');
            }
        });

        // Hide check answer button
        const checkAnswerBtn = document.getElementById('check-answer');
        if (checkAnswerBtn) {
            checkAnswerBtn.style.display = 'none';
        }

        // The ExerciseEngine will handle feedback and auto-advance
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

        // Check if level completed (this method needs to be added to ExerciseEngine)
        // For now, just start the next exercise
        this.startExercise();
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
