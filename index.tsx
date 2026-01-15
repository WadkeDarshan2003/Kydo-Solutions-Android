import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Initialize StatusBar safely - only on native platforms
const initializeStatusBar = async () => {
  try {
    // Check if running on native platform
    const isNative = !!(window as any).capacitor || !!(window as any).cordova;
    
    if (!isNative) {
      console.log('StatusBar not available - running on web/Electron');
      return;
    }

    // Only import if on native platform
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#111827' });
      await StatusBar.setOverlaysWebView({ overlay: true });
      
      console.log('StatusBar initialized successfully');
    } catch (importError) {
      console.error('StatusBar module not available:', importError);
    }
  } catch (error) {
    console.error('StatusBar init error (non-fatal):', error);
    // Continue app rendering even if StatusBar fails
  }
};

// Render app - StatusBar init happens in background
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Initialize StatusBar asynchronously (non-blocking)
initializeStatusBar().catch((error) => {
  console.error('StatusBar initialization failed:', error);
});