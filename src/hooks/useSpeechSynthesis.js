import { useCallback, useRef } from 'react';

/**
 * Robust speech synthesis hook.
 * - Waits for voices to load before speaking (fixes the Chrome "no voice" bug).
 * - Exposes isSpeaking state via a ref-backed callback so callers can react.
 * - Splits long text into sentence chunks to keep the browser TTS engine stable.
 */

function getVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(window.speechSynthesis.getVoices());
    }, { once: true });
  });
}

function pickHindiVoice(voices) {
  // Prefer hi-IN, then hi, then any Indian English voice as fallback
  return (
    voices.find((v) => v.lang === 'hi-IN') ||
    voices.find((v) => v.lang?.startsWith('hi')) ||
    voices.find((v) => v.lang === 'en-IN') ||
    null
  );
}

function splitSentences(text) {
  // Split on sentence-ending punctuation, keeping the delimiter
  return text
    .split(/(?<=[।.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function useSpeechSynthesis() {
  const cancelRef = useRef(false);
  const onWordRef = useRef(null); // callback(charIndex, text)

  const speak = useCallback(async (text, lang = 'hi-IN', onWord = null) => {
    if (!('speechSynthesis' in window)) return;
    cancelRef.current = false;
    onWordRef.current = onWord;

    window.speechSynthesis.cancel();
    const voices = await getVoices();
    const voice = pickHindiVoice(voices);

    const sentences = splitSentences(text);

    for (const sentence of sentences) {
      if (cancelRef.current) break;
      await new Promise((resolve) => {
        const utt = new SpeechSynthesisUtterance(sentence);
        utt.lang = lang;
        utt.rate = 0.88;
        utt.pitch = 1.05;
        utt.volume = 1;
        if (voice) utt.voice = voice;

        utt.onboundary = (e) => {
          if (onWordRef.current) onWordRef.current(e.charIndex, sentence);
        };
        utt.onend = resolve;
        utt.onerror = resolve;

        window.speechSynthesis.speak(utt);
      });
    }
  }, []);

  const stop = useCallback(() => {
    cancelRef.current = true;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}
