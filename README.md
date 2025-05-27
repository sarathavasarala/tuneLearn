# TuneLearn - Rich MIDI Keyboard Web Application

A powerful, browser-based MIDI keyboard application featuring virtual piano, chord detection, scale visualization, and comprehensive music theory training tools.

## 🎹 Features

### Core Functionality
- **Interactive Virtual Piano**: 88-key piano with visual feedback and customizable range
- **Web MIDI API Integration**: Connect external MIDI keyboards and controllers
- **Computer Keyboard Mapping**: Play using your computer keyboard with intuitive key mapping
- **Real-time Audio Synthesis**: Built with Web Audio API for high-quality sound

### Music Theory Tools
- **Chord Detection**: Real-time analysis of played chords with confidence scoring
- **Scale Visualization**: Highlight notes from 90+ different scales on the keyboard
- **Interval Analysis**: Display intervals between played notes
- **Comprehensive Chord Library**: Browse and play hundreds of chord variations

### Practice & Learning
- **Scale Practice Mode**: Interactive scale learning with visual guidance
- **Chord Practice Mode**: Learn chord progressions and voicings
- **Interval Training**: Develop your ear with interval recognition exercises
- **Session Statistics**: Track your practice time and progress

### Audio Features
- **ADSR Envelope Control**: Shape your sound with attack, decay, sustain, and release
- **Multiple Waveforms**: Choose from sine, sawtooth, square, and triangle waves
- **Built-in Metronome**: Adjustable tempo for practice sessions
- **Recording Capabilities**: Record and playback your performances

### Customization
- **Light/Dark Theme Toggle**: Switch between themes for comfortable use
- **Scale Lock Mode**: Restrict playback to notes within selected scales
- **Configurable Settings**: Adjust volume, display options, and keyboard mappings
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🚀 Getting Started

### Prerequisites
- Modern web browser with Web Audio API support (Chrome, Firefox, Safari, Edge)
- Optional: MIDI keyboard or controller for enhanced experience

### Quick Start
1. **Clone or download** this repository to your local machine
2. **Start a local server** using one of these methods:

   **Option 1: Using Python (recommended)**
   ```bash
   # Navigate to the project directory
   cd tunelearn
   
   # Start the development server
   npm run dev
   # or directly:
   python3 -m http.server 8080
   ```

   **Option 2: Using Node.js**
   ```bash
   # Install a simple HTTP server
   npm install -g http-server
   
   # Start the server
   http-server -p 8080
   ```

   **Option 3: Using VS Code Live Server**
   - Install the "Live Server" extension in VS Code
   - Right-click on `index.html` and select "Open with Live Server"

3. **Open your browser** and navigate to `http://localhost:8080`

4. **Grant permissions** for Web MIDI API when prompted (if using external MIDI devices)

5. **Start playing!** Use your mouse, computer keyboard, or MIDI device to play the virtual piano

## 🎯 Usage Guide

### Playing the Piano
- **Mouse**: Click on piano keys to play notes
- **Computer Keyboard**: Use the following key mapping:
  ```
  Piano:  C   C#  D   D#  E   F   F#  G   G#  A   A#  B   C
  Keys:   A   W   S   E   D   F   T   G   Y   H   U   J   K
  ```
- **MIDI Device**: Connect any MIDI keyboard and play naturally

### Exploring Scales
1. Select a scale from the dropdown menu
2. Watch as the piano highlights the scale notes
3. Enable "Scale Lock" to restrict playback to scale notes only
4. Use the practice mode to learn scale patterns

### Chord Detection
- Play multiple notes simultaneously
- View detected chord name and intervals in the info panel
- Chord confidence indicator shows detection accuracy

### Recording & Playback
- Click the record button to start capturing your performance
- Play back recordings to review your playing
- Clear recordings to start fresh

### Customization
- Toggle between light and dark themes
- Adjust master volume and audio settings
- Configure display options and keyboard mappings
- Settings are automatically saved to local storage

## 🛠️ Technical Architecture

### File Structure
```
tunelearn/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css          # Complete styling system
├── js/
│   ├── app.js              # Main application controller
│   ├── music-theory.js     # Music theory utilities and data
│   ├── audio-engine.js     # Web Audio API synthesis
│   ├── midi-handler.js     # MIDI device integration
│   ├── piano-keyboard.js   # Virtual piano component
│   ├── chord-detection.js  # Real-time chord analysis
│   └── practice-tools.js   # Learning and practice features
├── package.json            # Project configuration
└── README.md              # This file
```

### Key Technologies
- **Web Audio API**: Real-time audio synthesis and processing
- **Web MIDI API**: External MIDI device integration
- **Vanilla JavaScript**: No framework dependencies for optimal performance
- **CSS Grid/Flexbox**: Responsive layout system
- **Local Storage**: Settings and preferences persistence

### Browser Compatibility
- **Chrome 66+**: Full Web MIDI support
- **Firefox 99+**: Audio synthesis (limited MIDI support)
- **Safari 14.1+**: Audio synthesis (no Web MIDI)
- **Edge 79+**: Full Web MIDI support

## 🎵 Music Theory Reference

### Supported Scales (90+)
- **Major Scales**: Major, Ionian, Lydian, Mixolydian
- **Minor Scales**: Natural Minor, Harmonic Minor, Melodic Minor, Dorian, Phrygian, Aeolian
- **Pentatonic**: Major Pentatonic, Minor Pentatonic, Blues Scale
- **Modal**: All 7 church modes plus exotic modes
- **Jazz**: Bebop scales, altered scales, symmetric scales
- **World Music**: Various ethnic and cultural scales

### Chord Types Supported
- **Triads**: Major, minor, diminished, augmented
- **Seventh Chords**: Major 7th, minor 7th, dominant 7th, diminished 7th, half-diminished
- **Extended Chords**: 9th, 11th, 13th chords and variations
- **Altered Chords**: Suspended chords, add chords, modified tensions
- **Jazz Chords**: Complex harmony with multiple extensions

## 🔧 Development

### Local Development
1. Make changes to the source files
2. Refresh your browser to see updates
3. Use browser developer tools for debugging
4. All changes are immediately reflected (no build process required)

### Adding New Features
- **Scales**: Add new scale definitions to `music-theory.js`
- **Chords**: Extend chord patterns in the chord detection system
- **Audio**: Modify synthesis parameters in `audio-engine.js`
- **UI**: Update styles in `styles.css` and layout in `index.html`

### Performance Considerations
- Audio context is suspended when page is not visible
- MIDI events are throttled to prevent overwhelming the audio engine
- Visual updates use requestAnimationFrame for smooth animations
- Settings are debounced to reduce localStorage writes

## 📱 Mobile Support

The application is fully responsive and works on mobile devices:
- **Touch Interface**: Tap piano keys to play notes
- **Responsive Layout**: Adapts to different screen sizes
- **Mobile Gestures**: Pinch to zoom, scroll to navigate
- **Performance Optimized**: Efficient rendering for mobile browsers

Note: MIDI device support varies by mobile platform and browser.

## 🔒 Privacy & Data

- **No Server Communication**: Everything runs locally in your browser
- **No Data Collection**: No analytics, tracking, or data transmission
- **Local Storage Only**: Settings saved locally on your device
- **Secure Context**: HTTPS recommended for Web MIDI API access

## 🐛 Troubleshooting

### Common Issues

**No Sound**
- Check browser audio permissions
- Ensure volume is turned up
- Try clicking on the page first (browser autoplay policy)

**MIDI Not Working**
- Verify MIDI device is connected and powered on
- Grant Web MIDI API permissions when prompted
- Try refreshing MIDI devices in the settings
- Use HTTPS for better MIDI support

**Performance Issues**
- Close other audio-intensive applications
- Try a different browser or lower quality settings
- Reduce the number of simultaneous notes

### Browser Support Issues
- **Firefox**: Limited Web MIDI support - use Chrome for full functionality
- **Safari**: No Web MIDI support - virtual keyboard only
- **Mobile**: MIDI support varies by platform

## 🤝 Contributing

This is an open-source educational project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly across browsers
5. Submit a pull request

### Areas for Contribution
- Additional scale and chord definitions
- New practice modes and exercises
- Enhanced audio synthesis features
- Improved mobile experience
- Accessibility improvements
- Performance optimizations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Web Audio API documentation and examples
- Music theory resources from various educational sources
- Open source audio and MIDI libraries for reference

## 🔗 Resources

- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web MIDI API Specification](https://www.w3.org/TR/webmidi/)
- [Music Theory Reference](https://en.wikipedia.org/wiki/Music_theory)
- [MIDI Technical Standard](https://www.midi.org/specifications)

---

**Made with ❤️ for music enthusiasts and developers**

*This application demonstrates the power of modern web technologies for creating rich, interactive musical experiences entirely in the browser.*
