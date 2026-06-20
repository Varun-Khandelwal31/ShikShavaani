import { useCallback, useRef } from 'react';

/**
 * useSpeechSynthesis — robust cross-browser TTS hook.
 *
 * Key fixes vs naive implementations:
 * 1. Chrome requires a user-gesture context. We call speechSynthesis.resume()
 *    before every utterance to unblock the engine.
 * 2. Voices load asynchronously — we wait for voiceschanged before picking one.
 * 3. We do NOT split into sentences here. Long text is fine as one utterance;
 *    the caller (App.jsx) already calls speak() once per sentence/line.
 * 4. After cancel() we wait one tick before speaking to avoid the Chrome
 *    "utterance dropped" race condition.
 * 5. If no Hindi voice exists we fall back to the default voice — at least
 *    the user hears something rather than silence.
 */

function waitForVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    const handler = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
    // Safety timeout — resolve after 2 s even if event never fires
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 2000);
  });
}

function pickVoice(voices, lang) {
  if (!voices || voices.length === 0) return null;
  const tag = lang.toLowerCase();
  // Exact match first (hi-IN)
  const exact = voices.find(v => v.lang.toLowerCase() === tag);
  if (exact) return exact;
  // Prefix match (hi)
  const prefix = voices.find(v => v.lang.toLowerCase().startsWith(tag.split('-')[0]));
  if (prefix) return prefix;
  // Indian English fallback so at least something plays
  const enIN = voices.find(v => v.lang === 'en-IN');
  if (enIN) return enIN;
  // Absolute fallback — first available voice
  return voices[0] || null;
}

function speakUtterance(text, voice, lang, rate, pitch) {
  return new Promise((resolve) => {
    // Resume the engine — required by Chrome autoplay policy
    window.speechSynthesis.resume();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang   = lang;
    utt.rate   = rate;
    utt.pitch  = pitch;
    utt.volume = 1;
    if (voice) utt.voice = voice;

    utt.onend   = () => resolve(true);
    utt.onerror = (e) => {
      // 'interrupted' is normal when stop() is called — not an error
      if (e.error !== 'interrupted') console.warn('TTS error:', e.error);
      resolve(false);
    };

    window.speechSynthesis.speak(utt);

    // Chrome TTS watchdog: if onend never fires within 15 s, resolve anyway
    const watchdog = setTimeout(() => {
      window.speechSynthesis.cancel();
      resolve(false);
    }, 15000);
    utt.onend = () => { clearTimeout(watchdog); resolve(true); };
  });
}

export function useSpeechSynthesis() {
  const cancelledRef = useRef(false);
  const voicesRef    = useRef(null);   // cache voices after first load

  const speak = useCallback(async (text, lang = 'hi-IN') => {
    if (!('speechSynthesis' in window) || !text?.trim()) return;

    cancelledRef.current = false;

    // Cancel any ongoing speech, then wait one tick for the engine to settle
    window.speechSynthesis.cancel();
    await new Promise(r => setTimeout(r, 80));

    if (cancelledRef.current) return;

    // Load voices once and cache them
    if (!voicesRef.current || voicesRef.current.length === 0) {
      voicesRef.current = await waitForVoices();
    }
    const voice = pickVoice(voicesRef.current, lang);

    await speakUtterance(text.trim(), voice, lang, 0.88, 1.05);
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}
