import React, { useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

// Make turnstile available on the window object for TypeScript
declare global {
  interface Window {
    turnstile: any;
  }
}

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  // This is a test key. Replace with your actual key in a production environment.
  siteKey?: string; 
}

const Turnstile: React.FC<TurnstileProps> = ({ 
    onSuccess, 
    onExpire, 
    siteKey = '1x00000000000000000000AA', // Cloudflare's "always passes" test key for development
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    // Wait for the Turnstile script to load.
    if (!window.turnstile) {
        return;
    }
      
    if (!ref.current) {
      return;
    }

    const widgetId = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      callback: (token: string) => onSuccess(token),
      'expired-callback': () => {
        onExpire?.();
        // The token expired, so we reset it in the parent component.
        onSuccess(''); 
      },
      theme: theme,
    });

    return () => {
      if (window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [onSuccess, onExpire, siteKey, theme]);

  return <div ref={ref} />;
};

export default Turnstile;