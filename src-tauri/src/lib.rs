use std::sync::atomic::{AtomicIsize, Ordering};
use std::sync::RwLock;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

static LAST_TARGET_HWND: AtomicIsize = AtomicIsize::new(0);
static VOICEFLOW_HWND: AtomicIsize = AtomicIsize::new(0);
static LAST_TARGET_TITLE: RwLock<String> = RwLock::new(String::new());

#[cfg(target_os = "windows")]
use windows_sys::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE,
    VK_BACK,
};
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, GetWindowTextW, SetForegroundWindow,
};

#[cfg(target_os = "windows")]
fn get_window_title(hwnd: HWND) -> String {
    let mut buffer = [0u16; 512];
    let len = unsafe { GetWindowTextW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32) };
    if len > 0 {
        String::from_utf16_lossy(&buffer[..len as usize])
    } else {
        String::new()
    }
}

/// Start a lightweight background tracker for the user's active window
fn start_window_tracker(app: AppHandle) {
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_millis(50));
            #[cfg(target_os = "windows")]
            {
                let fg = unsafe { GetForegroundWindow() };
                let my_hwnd = VOICEFLOW_HWND.load(Ordering::Relaxed) as HWND;
                if fg != 0 as _ && fg != my_hwnd {
                    let prev = LAST_TARGET_HWND.swap(fg as isize, Ordering::Relaxed);
                    if prev != fg as isize {
                        let title = get_window_title(fg);
                        if let Ok(mut lock) = LAST_TARGET_TITLE.write() {
                            *lock = title.clone();
                        }
                        let _ = app.emit("target-window-changed", title);
                    }
                }
            }
        }
    });
}

/// Types text directly into the active/target application via Windows SendInput with Unicode
#[tauri::command]
fn type_text(text: String, restore_target: bool) -> Result<(), String> {
    if text.is_empty() {
        return Ok(());
    }

    #[cfg(target_os = "windows")]
    {
        let target_hwnd = LAST_TARGET_HWND.load(Ordering::Relaxed) as HWND;
        let my_hwnd = VOICEFLOW_HWND.load(Ordering::Relaxed) as HWND;
        let fg = unsafe { GetForegroundWindow() };

        // If VoiceFlow has focus or restore is requested, switch to target app
        if (restore_target || fg == my_hwnd) && target_hwnd != 0 as _ && target_hwnd != my_hwnd {
            unsafe {
                SetForegroundWindow(target_hwnd);
            }
            thread::sleep(Duration::from_millis(10));
        }

        // Batch all unicode keyboard inputs together into a single atomic SendInput call!
        // This delivers instant, zero-delay real-time typing across all Windows apps.
        let mut inputs: Vec<INPUT> = Vec::with_capacity(text.encode_utf16().count() * 2);

        for ch in text.encode_utf16() {
            inputs.push(INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: 0,
                        wScan: ch,
                        dwFlags: KEYEVENTF_UNICODE,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            });
            inputs.push(INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: 0,
                        wScan: ch,
                        dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            });
        }

        if !inputs.is_empty() {
            unsafe {
                SendInput(
                    inputs.len() as u32,
                    inputs.as_mut_ptr(),
                    std::mem::size_of::<INPUT>() as i32,
                );
            }
        }
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(())
    }
}

/// Alias for type_text to inject into active window
#[tauri::command]
fn inject_text(text: String) -> Result<(), String> {
    type_text(text, true)
}

/// Native window dragging command that works 100% reliably on Windows
#[tauri::command]
fn start_dragging(window: tauri::WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

/// Deletes previous characters by simulating backspace keys
#[tauri::command]
fn backspace(count: usize) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        for _ in 0..count {
            let mut inputs = [
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_BACK,
                            wScan: 0,
                            dwFlags: 0,
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_BACK,
                            wScan: 0,
                            dwFlags: KEYEVENTF_KEYUP,
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
            ];

            unsafe {
                SendInput(
                    inputs.len() as u32,
                    inputs.as_mut_ptr(),
                    std::mem::size_of::<INPUT>() as i32,
                );
            }
            thread::sleep(Duration::from_millis(5));
        }
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(())
    }
}

/// Returns the title of the current active target application
#[tauri::command]
fn get_target_window_title() -> Result<String, String> {
    if let Ok(lock) = LAST_TARGET_TITLE.read() {
        Ok(lock.clone())
    } else {
        Ok(String::new())
    }
}

/// Dynamically switch window between Collapsed pill and Expanded mode
/// Supports both { mode: "collapsed" | "expanded" } and { expanded: true | false }
#[tauri::command]
fn set_window_mode(
    app: AppHandle,
    expanded: Option<bool>,
    mode: Option<String>,
) -> Result<(), String> {
    let is_expanded = expanded.unwrap_or_else(|| mode.as_deref() == Some("expanded"));

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_resizable(true);
        if is_expanded {
            let _ = window.set_min_size(Some(tauri::LogicalSize::new(280.0, 420.0)));
            let _ = window.set_max_size(None::<tauri::LogicalSize<f64>>);
            let _ = window.set_size(tauri::LogicalSize::new(380.0, 710.0));
            let _ = window.set_always_on_top(true);
        } else {
            let _ = window.set_min_size(Some(tauri::LogicalSize::new(200.0, 52.0)));
            let _ = window.set_max_size(None::<tauri::LogicalSize<f64>>);
            let _ = window.set_size(tauri::LogicalSize::new(320.0, 70.0));
            let _ = window.set_always_on_top(true);
        }
    }
    Ok(())
}

/// Resize the window directly by delta (for custom resize grips)
#[tauri::command]
fn resize_window_by(app: AppHandle, delta_x: f64, delta_y: f64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(size) = window.inner_size() {
            let scale = window.scale_factor().unwrap_or(1.0);
            let new_w = (size.width as f64 + delta_x * scale).max(200.0);
            let new_h = (size.height as f64 + delta_y * scale).max(52.0);
            let _ = window.set_size(tauri::PhysicalSize::new(new_w as u32, new_h as u32));
        }
    }
    Ok(())
}


/// Toggle voice listening state
#[tauri::command]
fn toggle_listening(app: AppHandle, _config: Option<serde_json::Value>) -> Result<bool, String> {
    static IS_LISTENING: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);
    let prev = IS_LISTENING.fetch_xor(true, Ordering::Relaxed);
    let current = !prev;
    let _ = app.emit("listening-state", current);
    Ok(current)
}

/// Configure start on system boot via Windows Registry Run key
#[tauri::command]
fn set_autostart(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(exe) = std::env::current_exe() {
            let exe_str = exe.to_string_lossy().to_string();
            if enabled {
                let _ = std::process::Command::new("reg")
                    .args([
                        "add",
                        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                        "/v",
                        "VoiceFlow",
                        "/t",
                        "REG_SZ",
                        "/d",
                        &format!("\"{}\"", exe_str),
                        "/f",
                    ])
                    .output();
            } else {
                let _ = std::process::Command::new("reg")
                    .args([
                        "delete",
                        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                        "/v",
                        "VoiceFlow",
                        "/f",
                    ])
                    .output();
            }
        }
    }
    Ok(())
}

/// Change the registered global shortcut
#[tauri::command]
fn register_shortcut(app: AppHandle, shortcut_str: String) -> Result<(), String> {
    if let Ok(shortcut) = shortcut_str.parse::<tauri_plugin_global_shortcut::Shortcut>() {
        let _ = app.global_shortcut().unregister_all();
        app.global_shortcut().register(shortcut).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Invalid shortcut string. Try e.g. 'Alt+KeyV' or 'Control+Shift+Space'".to_string())
    }
}

/// Minimize the window
#[tauri::command]
fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
    Ok(())
}

/// Close the application
#[tauri::command]
fn close_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let _ = app.emit("toggle-listening", ());
                    }
                })
                .build(),
        )
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "windows")]
                {
                    if let Ok(hwnd) = window.hwnd() {
                        VOICEFLOW_HWND.store(hwnd.0 as isize, Ordering::Relaxed);
                    }
                }
                let _ = window.set_always_on_top(true);
            }

            // Register global hotkey Alt+V
            if let Ok(shortcut) = "Alt+KeyV".parse::<tauri_plugin_global_shortcut::Shortcut>() {
                let _ = app.global_shortcut().register(shortcut);
            }

            start_window_tracker(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            type_text,
            inject_text,
            start_dragging,
            backspace,
            get_target_window_title,
            set_window_mode,
            resize_window_by,
            toggle_listening,
            set_autostart,
            register_shortcut,
            minimize_window,
            close_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
