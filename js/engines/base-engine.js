// js/engines/base-engine.js
class MusicTheoryEngine {
    constructor(engineName) {
        if (this.constructor === MusicTheoryEngine) {
            // Abstract class cannot be instantiated directly
            // However, JS doesn't have true abstract classes, so we'll rely on convention
            // and subclasses overriding methods.
        }
        this.engineName = engineName;
    }

    generateExercise(options) {
        // This method should be overridden by subclasses
        throw new Error("Method 'generateExercise()' must be implemented.");
    }

    validateAnswer(userInput, exerciseData) {
        // This method should be overridden by subclasses
        throw new Error("Method 'validateAnswer()' must be implemented.");
    }

    getExerciseTypeName() {
        return this.engineName;
    }

    getTheorySnippet(exerciseData) {
        // Default implementation, can be overridden
        return exerciseData && exerciseData.theorySnippet ? exerciseData.theorySnippet : "";
    }
}

// Assuming global scope for now, like other project files
if (typeof window !== 'undefined') {
    window.MusicTheoryEngine = MusicTheoryEngine;
}
