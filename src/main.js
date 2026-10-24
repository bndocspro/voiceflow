import { VoiceEngine } from './geminiLive.js';

// Safe Tauri API accessor
const tauri = window.__TAURI__ || null;
const invoke = tauri?.core?.invoke || (async () => {});
const eventPlugin = tauri?.event || null;

// DOM Elements - Collapsed View
const collapsedView = document.getElementById('collapsed-view');
const pillMicBtn = document.getElementById('pill-mic-btn');
const pillStatusText = document.getElementById('pill-status-text');
const pillPulseDot = document.getElementById('pill-pulse-dot');
const pillWaveform = document.getElementById('pill-waveform');
const pillExpandBtn = document.getElementById('pill-expand-btn');

// DOM Elements - Expanded View
const expandedView = document.getElementById('expanded-view');
const expandedMicBtn = document.getElementById('expanded-mic-btn');
const expandedStatusLabel = document.getElementById('expanded-status-label');
const expandedPulseDot = document.getElementById('expanded-pulse-dot');
const expandedWaveform = document.getElementById('expanded-waveform');
const targetWindowBadge = document.getElementById('target-window-badge');
const btnCollapse = document.getElementById('btn-collapse');
const btnClose = document.getElementById('btn-close');

// DOM Elements - Editor & Actions
const textarea = document.getElementById('transcription-textarea');
const btnFormat = document.getElementById('btn-format');
const btnCopyEditor = document.getElementById('btn-copy-editor');
const btnSpeak = document.getElementById('btn-speak');
const btnSendType = document.getElementById('btn-send-type');

// DOM Elements - Tabs & Settings
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const settingLanguage = document.getElementById('setting-language');
const settingVoice = document.getElementById('setting-voice');
const settingSpeed = document.getElementById('setting-speed');
const speedVal = document.getElementById('speed-val');
const settingPunctuation = document.getElementById('setting-punctuation');
const settingDirectType = document.getElementById('setting-direct-type');
const settingNotifications = document.getElementById('setting-notifications');
const settingBoot = document.getElementById('setting-boot');
const settingModel = document.getElementById('setting-model');
const settingApiKey = document.getElementById('setting-api-key');
const btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');

// DOM Elements - History & Bottom Bar
const historyContainer = document.getElementById('history-container');
const btnClearHistory = document.getElementById('btn-clear-history');
const btnBottomCopy = document.getElementById('btn-bottom-copy');
const btnBottomClear = document.getElementById('btn-bottom-clear');
const btnBottomTranslate = document.getElementById('btn-bottom-translate');
const btnBottomSettings = document.getElementById('btn-bottom-settings');
const toastEl = document.getElementById('toast');

// State Management
let currentMode = 'expanded'; // 'collapsed' | 'expanded'
let history = JSON.parse(localStorage.getItem('vf_history') || '[]');
let settings = {
  language: localStorage.getItem('vf_lang') || 'en-US',
  voice: localStorage.getItem('vf_voice') || 'Jenny',
  speed: parseFloat(localStorage.getItem('vf_speed') || '1.0'),
  autoPunctuation: localStorage.getItem('vf_punct') !== 'false',
  directType: localStorage.getItem('vf_direct_type') !== 'false',
  notifications: localStorage.getItem('vf_notif') !== 'false',
  boot: localStorage.getItem('vf_boot') === 'true',
  model: localStorage.getItem('vf_model') || 'gemini-3.5-transcribe-live',
  apiKey: localStorage.getItem('vf_key') || ''
};

// Initialize UI with saved settings
function loadSettings() {
  if (settingLanguage) settingLanguage.value = settings.language;
  if (settingVoice) settingVoice.value = settings.voice;
  if (settingSpeed) settingSpeed.value = settings.speed;
  if (speedVal) speedVal.textContent = `${settings.speed.toFixed(1)}x`;
  settingPunctuation.checked = settings.autoPunctuation;
  settingDirectType.checked = settings.directType;
  settingNotifications.checked = settings.notifications;
  settingBoot.checked = settings.boot;
  settingModel.value = settings.model;
  settingApiKey.value = settings.apiKey;
}

loadSettings();

// Toast helper
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2200);
}

// Instantiate VoiceEngine
const voiceEngine = new VoiceEngine({
  apiKey: settings.apiKey,
  model: settings.model,
  language: settings.language,
  mode: settings.autoPunctuation ? 'smart' : 'verbatim',

  onStatusChange: (status) => {
    pillStatusText.textContent = status;
    expandedStatusLabel.textContent = status;

    const isActive = status === 'Listening...';
    pillMicBtn.classList.toggle('active', isActive);
    expandedMicBtn.classList.toggle('active', isActive);
    pillPulseDot.classList.toggle('active', isActive);
    expandedPulseDot.classList.toggle('active', isActive);
  },

  onAudioLevel: (levels) => {
    // Update waveform bars in Collapsed mode
    const pillBars = pillWaveform.querySelectorAll('.wave-bar');
    pillBars.forEach((bar, idx) => {
      const height = Math.max(3, Math.min(18, (levels[idx % levels.length] || 0.1) * 20));
      bar.style.height = `${height}px`;
    });

    // Update waveform bars in Expanded mode
    const expBars = expandedWaveform.querySelectorAll('.wave-bar');
    expBars.forEach((bar, idx) => {
      const height = Math.max(3, Math.min(18, (levels[idx % levels.length] || 0.1) * 20));
      bar.style.height = `${height}px`;
    });
  },

  onInterimText: (interim) => {
    // If user is currently focused or viewing, show interim prediction
    if (interim) {
      // In live text display, append temporary preview indicator
      const currentVal = textarea.value.trim();
      // Only show preview if text isn't empty
      pillStatusText.textContent = 'Transcribing...';
    }
  },

  onFinalText: async (finalText) => {
    if (!finalText || !finalText.trim()) return;

    let textToInsert = finalText.trim();

    // Auto punctuation and capitalization polish
    if (settings.autoPunctuation) {
      if (!/[.!?]$/.test(textToInsert)) {
        textToInsert += '.';
      }
    }

    // Append to textarea
    const prev = textarea.value.trim();
    textarea.value = prev ? `${prev} ${textToInsert}` : textToInsert;
    textarea.scrollTop = textarea.scrollHeight;

    // Add to history
    addToHistory(textToInsert);

    // DIRECT TYPE ANYWHERE ENGINE
    // If Direct Type Anywhere is enabled, send Unicode keystrokes directly into active PC app!
    if (settings.directType) {
      try {
        await invoke('type_text', {
          text: ` ${textToInsert}`,
          restoreTarget: true
        });
      } catch (err) {
        console.warn('Native typing simulation notice:', err);
      }
    }

    if (settings.notifications && currentMode === 'collapsed') {
      showToast(`Typed: "${textToInsert.slice(0, 24)}..."`);
    }
  },

  onError: (errMsg) => {
    showToast(errMsg);
    console.error(errMsg);
  }
});

// Mode Switching: Collapsed <-> Expanded
async function switchWindowMode(mode) {
  currentMode = mode;
  if (mode === 'collapsed') {
    expandedView.style.display = 'none';
    collapsedView.style.display = 'flex';
    document.body.style.padding = '0';
    try {
      await invoke('set_window_mode', { mode: 'collapsed' });
    } catch (_) {}
  } else {
    collapsedView.style.display = 'none';
    expandedView.style.display = 'flex';
    document.body.style.padding = '8px';
    try {
      await invoke('set_window_mode', { mode: 'expanded' });
    } catch (_) {}
  }
}

// Collapsed Expand Button
pillExpandBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  switchWindowMode('expanded');
});

// Expanded Collapse Button
btnCollapse.addEventListener('click', () => {
  switchWindowMode('collapsed');
});

// Close / Minimize Button
btnClose.addEventListener('click', async () => {
  // If in expanded, collapse first; if already collapsed, minimize window
  if (currentMode === 'expanded') {
    switchWindowMode('collapsed');
  } else {
    try {
      await invoke('minimize_window');
    } catch (_) {}
  }
});

// Toggle Voice Typing (Click on Mic button)
function toggleVoiceTyping() {
  voiceEngine.toggle();
}

pillMicBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleVoiceTyping();
});

expandedMicBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleVoiceTyping();
});

// Format / Polish text button
btnFormat.addEventListener('click', () => {
  let val = textarea.value.trim();
  if (!val) return;
  // Capitalize first letters of sentences
  val = val.replace(/(^\s*|\.\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  if (!/[.!?]$/.test(val)) val += '.';
  textarea.value = val;
  showToast('Text formatted & polished');
});

// Copy button
btnCopyEditor.addEventListener('click', async () => {
  if (!textarea.value.trim()) return;
  await navigator.clipboard.writeText(textarea.value);
  showToast('Copied to clipboard');
});

btnBottomCopy.addEventListener('click', async () => {
  if (!textarea.value.trim()) return;
  await navigator.clipboard.writeText(textarea.value);
  showToast('Copied to clipboard');
});

// Clear button
btnBottomClear.addEventListener('click', () => {
  textarea.value = '';
  showToast('Cleared editor');
});

// Speak button (TTS)
btnSpeak.addEventListener('click', () => {
  const text = textarea.value.trim();
  if (!text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = settings.speed;

  // Try matching voice by name
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.name.toLowerCase().includes(settings.voice.toLowerCase()));
  if (match) utterance.voice = match;

  window.speechSynthesis.speak(utterance);
  showToast('Speaking...');
});

// Send / Type Into Active PC App button
btnSendType.addEventListener('click', async () => {
  const text = textarea.value.trim();
  if (!text) return;

  try {
    await invoke('type_text', {
      text: text,
      restoreTarget: true
    });
    showToast('Typed into active application!');
  } catch (err) {
    showToast(`Type error: ${err}`);
  }
});

// Bottom quick Settings button
btnBottomSettings.addEventListener('click', () => {
  switchTab('settings');
});

// Bottom quick Translate button
btnBottomTranslate.addEventListener('click', () => {
  const text = textarea.value.trim();
  if (!text) return;
  textarea.value = `[${settings.language}] ${text}`;
  showToast(`Tagged language: ${settings.language}`);
});

// Tabs Switching
function switchTab(tabName) {
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

// Settings Event Listeners
settingLanguage?.addEventListener('change', (e) => {
  settings.language = e.target.value;
  localStorage.setItem('vf_lang', settings.language);
  voiceEngine.setLanguage(settings.language);
  showToast(`Language set to ${e.target.options[e.target.selectedIndex].text}`);
});

settingVoice?.addEventListener('change', (e) => {
  settings.voice = e.target.value;
  localStorage.setItem('vf_voice', settings.voice);
});

settingSpeed.addEventListener('input', (e) => {
  settings.speed = parseFloat(e.target.value);
  speedVal.textContent = `${settings.speed.toFixed(1)}x`;
  localStorage.setItem('vf_speed', settings.speed);
});

settingPunctuation.addEventListener('change', (e) => {
  settings.autoPunctuation = e.target.checked;
  localStorage.setItem('vf_punct', settings.autoPunctuation);
  voiceEngine.setMode(settings.autoPunctuation ? 'smart' : 'verbatim');
});

settingDirectType.addEventListener('change', (e) => {
  settings.directType = e.target.checked;
  localStorage.setItem('vf_direct_type', settings.directType);
  showToast(settings.directType ? 'Direct typing enabled' : 'Direct typing paused');
});

settingNotifications.addEventListener('change', (e) => {
  settings.notifications = e.target.checked;
  localStorage.setItem('vf_notif', settings.notifications);
});

settingBoot.addEventListener('change', (e) => {
  settings.boot = e.target.checked;
  localStorage.setItem('vf_boot', settings.boot);
});

settingModel.addEventListener('change', (e) => {
  settings.model = e.target.value;
  localStorage.setItem('vf_model', settings.model);
  voiceEngine.setModel(settings.model);
  showToast(`Model: ${e.target.options[e.target.selectedIndex].text}`);
});

settingApiKey.addEventListener('input', (e) => {
  settings.apiKey = e.target.value.trim();
  localStorage.setItem('vf_key', settings.apiKey);
  voiceEngine.setApiKey(settings.apiKey);
});

btnToggleKeyVisibility.addEventListener('click', () => {
  const isPass = settingApiKey.type === 'password';
  settingApiKey.type = isPass ? 'text' : 'password';
});

// History Management
function renderHistory() {
  historyContainer.innerHTML = '';
  if (history.length === 0) {
    historyContainer.innerHTML = `<div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 16px;">No recent transcriptions</div>`;
    return;
  }

  history.slice(0, 20).forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <span class="history-text">${escapeHtml(item.text)}</span>
      <div class="history-footer">
        <span>${item.time}</span>
        <div class="history-card-actions">
          <button class="btn-pill-sm btn-retype" data-idx="${index}">Type</button>
          <button class="btn-pill-sm btn-copy-card" data-idx="${index}">Copy</button>
        </div>
      </div>
    `;
    historyContainer.appendChild(card);
  });

  // Re-attach listeners
  historyContainer.querySelectorAll('.btn-retype').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const item = history[idx];
      if (item) {
        await invoke('type_text', { text: item.text, restoreTarget: true });
        showToast('Typed from history!');
      }
    });
  });

  historyContainer.querySelectorAll('.btn-copy-card').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const item = history[idx];
      if (item) {
        await navigator.clipboard.writeText(item.text);
        showToast('Copied from history');
      }
    });
  });
}

function addToHistory(text) {
  const item = {
    text: text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  history.unshift(item);
  if (history.length > 50) history.pop();
  localStorage.setItem('vf_history', JSON.stringify(history));
  renderHistory();
}

btnClearHistory.addEventListener('click', () => {
  history = [];
  localStorage.setItem('vf_history', '[]');
  renderHistory();
  showToast('History cleared');
});

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

renderHistory();

// Listen to Global Shortcuts & Window Events from Rust
if (eventPlugin && eventPlugin.listen) {
  // Global Shortcut Alt+V triggers toggling voice listening
  eventPlugin.listen('toggle-listening', () => {
    toggleVoiceTyping();
  });

  // Target window changed (e.g. user switched from Chrome to Slack or Notepad)
  eventPlugin.listen('target-window-changed', (event) => {
    if (event.payload) {
      const title = event.payload;
      const cleanTitle = title.length > 20 ? title.substring(0, 18) + '...' : title;
      targetWindowBadge.textContent = `Target: ${cleanTitle}`;
      targetWindowBadge.title = `Active Target: ${title}`;
    }
  });
}

// Initial Target Window fetch
(async () => {
  try {
    const title = await invoke('get_target_window_title');
    if (title) {
      const cleanTitle = title.length > 20 ? title.substring(0, 18) + '...' : title;
      targetWindowBadge.textContent = `Target: ${cleanTitle}`;
      targetWindowBadge.title = `Active Target: ${title}`;
    }
  } catch (_) {}
})();

// Keyboard shortcuts inside window
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    switchWindowMode('collapsed');
  } else if (e.key === 'Enter' && e.ctrlKey) {
    btnSendType.click();
  }
});
