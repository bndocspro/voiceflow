# VoiceFlow - Speak. Type. Anywhere. 🎙️⚡

> Lightweight, lightning-fast native Windows voice typing software built with **Rust + Tauri v2** and powered by the **Google Gemini Live API**.

![VoiceFlow UI](./VoiceFlow_%20Voice%20Typing%20Anywhere.png)

## ✨ Highlights

- **Type Anywhere Across Windows**: Move your cursor into any app on PC (Google Docs, Microsoft Word, Notepad, Slack, Chrome, Discord, VS Code, etc.), press **`Alt + V`**, and speak. VoiceFlow streams Unicode keystrokes directly into your active cursor!
- **Two Flexible UI Modes**:
  - **Collapsed Mode (Floating Pill)**: Minimalist floating pill widget that hovers unobtrusively over any active application with a real-time reactive audio waveform and status indicator. Draggable anywhere across your screen.
  - **Expanded Mode (Full Card)**: Comprehensive studio view with live transcription editor, formatting tools, TTS playback, injection button (`->`), Settings, History, and diagnostics.
- **Ultra Low Resource Footprint**:
  - Built with **Rust** and **Tauri v2** (native WebView2).
  - Uses only ~25-35MB of RAM (vs 250MB+ in typical Electron apps).
  - Less than 0.5% CPU when idle.
  - Standalone compiled binary (`voiceflow.exe`).
- **Gemini Live API Integration (`gemini-3.5-transcribe-live` / `gemini-3.8-live`)**:
  - Real-time bidirectional streaming over WebSockets.
  - 16kHz mono 16-bit PCM little-endian audio streaming.
  - Interim hypothesis streaming and smart auto-formatting.
  - Hybrid VAD (Voice Activity Detection) with stream pause detection.
  - Seamless fallback to Web Speech API when no API key is provided for instant out-of-the-box testing.

---

## ⌨️ Global Shortcuts

| Shortcut | Description |
| :--- | :--- |
| **`Alt + V`** | Global hotkey to toggle Voice Typing anywhere across Windows |
| **`Ctrl + Enter`** | Immediately type/inject current editor text into active app |
| **`Esc`** | Collapse full widget down to floating pill mode |

---

## 🛠️ Architecture

```
d:/type/
├── src/                          # Frontend UI (Vanilla JS & Modern CSS)
│   ├── index.html                # Collapsed pill & Expanded card UI
│   ├── styles.css                # Polished glassmorphism design system
│   ├── main.js                   # Glue code connecting UI, Tauri & Gemini Engine
│   └── geminiLive.js             # 16kHz PCM streaming & Gemini Live WebSocket client
├── src-tauri/                    # Native Rust Backend
│   ├── Cargo.toml                # Rust dependencies & optimization profiles
│   ├── tauri.conf.json           # Transparent, frameless window configuration
│   └── src/
│       ├── lib.rs                # Windows SendInput Unicode injector & window tracker
│       └── main.rs               # Desktop entry point
└── VoiceFlow_ Voice Typing Anywhere.png  # Design reference
```

---

## 🚀 Running & Building

### 1. Run Development Mode
```powershell
npm run tauri dev
```

### 2. Build Release Executable
```powershell
cargo build --release --manifest-path src-tauri/Cargo.toml
```
The optimized executable will be located at:
```
src-tauri/target/release/voiceflow.exe
```

---

## 🔑 Gemini Live API Configuration

1. Launch VoiceFlow.
2. Open the **Settings** tab.
3. Paste your Gemini API key into the **Gemini API Key** field (starts with `AIzaSy...`).
4. Select `Gemini 3.5 Transcribe Live` or `Gemini 3.8 Live`.
5. VoiceFlow will automatically connect to Google's real-time WebSocket endpoint.
