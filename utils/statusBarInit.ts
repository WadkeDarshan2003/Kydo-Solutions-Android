import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Initialize the native StatusBar with dark blue background
 * Uses overlay mode so app content includes status bar area
 */
export async function initializeStatusBar(): Promise<void> {
  try {
    // Only run on native platforms (Android, iOS)
    const isNative = (window as any).cordova || (window as any).capacitor;
    
    if (!isNative) {
      console.log('StatusBar not available on web platform');
      return;
    }

    // Set status bar style to dark (dark icons/text for light background behavior)
    // With dark background, this may need adjustment - trying Dark for better visibility
    await StatusBar.setStyle({ style: Style.Dark });

    // Set background color to dark gray (#111827 = gray-900)
    await StatusBar.setBackgroundColor({ color: '#111827' });

    // Overlay mode - app renders behind status bar, we handle spacing with CSS
    await StatusBar.setOverlaysWebView({ overlay: true });

    console.log('StatusBar initialized: light style, dark blue background, overlay mode');
  } catch (error) {
    console.error('Error initializing StatusBar:', error);
    // Non-fatal error; app continues to work
  }
}
