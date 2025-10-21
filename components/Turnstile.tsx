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
  // This is a public site key from Cloudflare Turnstile
  siteKey?: string; 
}

const Turnstile: React.FC<TurnstileProps> = ({ 
    onSuccess, 
    onExpire, 
    siteKey = '0x4AAAAAAB77aMdefxYyDsH1',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null); // Use a ref to avoid re-renders on widgetId change
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const render = () => {
      if (!ref.current || !window.turnstile) {
        return;
      }

      // If a widget already exists, remove it. This handles theme changes.
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (token: string) => onSuccess(token),
        'expired-callback': () => {
          onExpire?.();
          // The token expired, so we reset it in the parent component.
          onSuccess(''); 
        },
        theme: theme,
      });
    };

    // If turnstile is already loaded, render it.
    if (window.turnstile) {
      render();
    } else {
      // If not, poll for the script to load.
      intervalId = setInterval(() => {
        if (window.turnstile) {
          if (intervalId) clearInterval(intervalId);
          render();
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (widgetIdRef.current && window.turnstile) {
        try {
          // The widget might have already been removed by an unmount/remount cycle.
          // Adding a try-catch to prevent errors on cleanup.
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
            console.warn('Turnstile widget cleanup failed:', error);
        }
      }
    };
  }, [onSuccess, onExpire, siteKey, theme]);

  return <div ref={ref} />;
};

export default Turnstile;
