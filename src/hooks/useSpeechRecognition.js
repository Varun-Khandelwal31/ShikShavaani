import { useCallback, useRef, useState } from 'react';

export function useSpeechRecognition({ onResult, onError }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('Browser mein speech recognition support nahi hai. Chrome use karein.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      onError(`Awaaz nahi sunai di: ${event.error}`);
    };
    recognition.onresult = (event) => {
      const current = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setTranscript(current);
      if (event.results[event.results.length - 1].isFinal) {
        onResult(current);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onError, onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening };
}
