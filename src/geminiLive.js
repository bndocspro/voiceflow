/**
 * Gemini Live API & Web Audio Streaming Engine for VoiceFlow
 * Follows Google Gemini Live API specifications:
 * - 16kHz 16-bit PCM Mono audio streaming over WebSocket
 * - Models: gemini-3.5-transcribe-live, gemini-3.8-live
 * - Real-time interim & finalized transcriptions
 * - Real-time Audio Visualizer FFT data
 * - Fallback to Web Speech API when API key is not configured
 */

export class VoiceEngine {
  constructor(options = {}) {
    this.apiKey = options.apiKey || '';
    this.model = options.model || 'gemini-3.5-transcribe-live';
    this.language = options.language || 'en-US';
    this.mode = options.mode || 'smart'; // 'smart' | 'verbatim'
    this.autoPunctuation = options.autoPunctuation ?? true;

    // Callbacks
    this.onInterimText = options.onInterimText || (() => {});
    this.onFinalText = options.onFinalText || (() => {});
    this.onAudioLevel = options.onAudioLevel || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onError = options.onError || (() => {});

    // State
    this.isListening = false;
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.analyser = null;
    this.websocket = null;
    this.speechRecognition = null;
    this.visualizerFrame = null;
    this.useWebSpeech = false;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  setModel(model) {
    this.model = model;
  }

  setLanguage(lang) {
    this.language = lang;
    if (this.speechRecognition) {
      this.speechRecognition.lang = lang;
    }
  }

  setMode(mode) {
    this.mode = mode;
  }

  async start() {
    if (this.isListening) return;

    this.onStatusChange('Connecting...');

    // If Gemini API Key is provided and not explicitly set to Web Speech, use Gemini Live API
    if (this.apiKey && this.apiKey.trim().length > 10 && this.model !== 'web-speech') {
      try {
        await this.startGeminiLive();
        return;
      } catch (err) {
        console.warn('Gemini Live API connection failed, falling back to Web Speech API:', err);
        this.onError(`Gemini Live: ${err.message || 'Connection failed'}. Using Web Speech fallback.`);
      }
    }

    // Fallback: Web Speech API (Local / Browser built-in)
    await this.startWebSpeech();
  }

  async startGeminiLive() {
    this.useWebSpeech = false;
    await this.initMicrophone();

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey.trim()}`;
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = () => {
      this.isListening = true;
      this.onStatusChange('Listening...');
      this.startVisualizer();

      // Send initial Gemini Live Setup frame
      const setupMessage = {
        setup: {
          model: `models/${this.model}`,
          generationConfig: {
            responseModalities: ["TEXT"],
            speechConfig: {
              voiceConfig: {}
            }
          },
          inputAudioTranscription: {
            mode: this.mode
          }
        }
      };

      this.websocket.send(JSON.stringify(setupMessage));
    };

    this.websocket.onmessage = async (event) => {
      try {
        let data;
        if (event.data instanceof Blob) {
          data = JSON.parse(await event.data.text());
        } else {
          data = JSON.parse(event.data);
        }

        const serverContent = data.serverContent;
        if (serverContent) {
          // Interim transcription (real-time prediction)
          if (serverContent.interimInputTranscription?.text) {
            this.onInterimText(serverContent.interimInputTranscription.text);
          }

          // Finalized transcription
          if (serverContent.inputTranscription?.text) {
            this.onFinalText(serverContent.inputTranscription.text);
          }

          // If model turn parts contain text (e.g. gemini-3.8-live text modality)
          if (serverContent.modelTurn?.parts) {
            for (const part of serverContent.modelTurn.parts) {
              if (part.text) {
                this.onFinalText(part.text);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error parsing Gemini Live message:', err);
      }
    };

    this.websocket.onerror = (err) => {
      console.error('Gemini Live WebSocket error:', err);
      this.onError('Live API WebSocket connection error');
    };

    this.websocket.onclose = () => {
      if (this.isListening) {
        this.stop();
      }
    };
  }

  async startWebSpeech() {
    this.useWebSpeech = true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.onError('Web Speech API is not supported in this environment and no Gemini API Key is set.');
      return;
    }

    await this.initMicrophone();

    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = this.language;

    this.speechRecognition.onstart = () => {
      this.isListening = true;
      this.onStatusChange('Listening...');
      this.startVisualizer();
    };

    this.speechRecognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        this.onInterimText(interim);
      }

      if (final) {
        this.onFinalText(final);
      }
    };

    this.speechRecognition.onerror = (event) => {
      console.warn('Speech Recognition error:', event.error);
      if (event.error !== 'no-speech') {
        this.onError(`Speech Error: ${event.error}`);
      }
    };

    this.speechRecognition.onend = () => {
      // Auto-restart if user still wants to listen
      if (this.isListening && this.useWebSpeech) {
        try {
          this.speechRecognition.start();
        } catch (_) {}
      }
    };

    try {
      this.speechRecognition.start();
    } catch (err) {
      this.onError(err.message);
    }
  }

  async initMicrophone() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000
    });

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Audio Analyser for real-time waveform bars
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;
    source.connect(this.analyser);

    // ScriptProcessor to stream PCM chunks if using Gemini Live
    const bufferSize = 2048; // ~128ms chunks at 16kHz
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isListening || this.useWebSpeech || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        return;
      }

      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(inputData.length);

      for (let i = 0; i < inputData.length; i++) {
        // Clamp to [-1, 1] and convert to 16-bit PCM
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Convert PCM16 to Base64
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      // Send realtimeInput chunk
      const mediaChunkMessage = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Data
            }
          ]
        }
      };

      this.websocket.send(JSON.stringify(mediaChunkMessage));
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  startVisualizer() {
    if (this.visualizerFrame) {
      cancelAnimationFrame(this.visualizerFrame);
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.isListening) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Normalize levels to array of 0..1 heights for waveform bars
      const levels = [];
      const step = Math.max(1, Math.floor(dataArray.length / 16));
      for (let i = 0; i < 16; i++) {
        const val = dataArray[i * step] || 0;
        levels.push(Math.min(1, Math.max(0.08, val / 255)));
      }

      this.onAudioLevel(levels);
      this.visualizerFrame = requestAnimationFrame(update);
    };

    update();
  }

  stop() {
    this.isListening = false;
    this.onStatusChange('Ready');

    if (this.visualizerFrame) {
      cancelAnimationFrame(this.visualizerFrame);
      this.visualizerFrame = null;
    }

    // Zero out visualizer bars
    this.onAudioLevel(new Array(16).fill(0.08));

    if (this.websocket) {
      try {
        if (this.websocket.readyState === WebSocket.OPEN) {
          // Send Hybrid VAD stream end
          this.websocket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
          this.websocket.close();
        }
      } catch (_) {}
      this.websocket = null;
    }

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (_) {}
      this.speechRecognition = null;
    }

    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (_) {}
      this.processor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }
}
