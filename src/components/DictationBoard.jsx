import { useState } from 'react';
import { translateText } from '../services/geminiService.js';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';

export default function DictationBoard() {
  const [status, setStatus]     = useState('idle'); // idle | listening | loading | done | error
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [manualText, setManual] = useState('');

  const { speak, stop }         = useSpeechSynthesis();

  const runTranslation = async (text) => {
    if (!text.trim()) return;
    setStatus('loading');
    setError('');
    try {
      const data = await translateText(text.trim());
      setResult(data);
      setStatus('done');
      // Auto-speak the Hindi translation
      await speak(data.hindi, 'hi-IN');
    } catch (err) {
      setError(err.message || 'Translation fail ho gayi.');
      setStatus('error');
    }
  };

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: (text) => {
      setStatus('loading');
      runTranslation(text);
    },
    onError: (msg) => { setError(msg); setStatus('error'); },
  });

  const handleMic = () => {
    stop();
    if (isListening) { stopListening(); setStatus('idle'); return; }
    setResult(null);
    setStatus('listening');
    startListening();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runTranslation(manualText);
  };

  const replayHindi = () => result && speak(result.hindi, 'hi-IN');

  return (
    <div className="dict-board">
      {/* Header */}
      <div className="dict-header">
        <div className="dict-icon">🌐</div>
        <div>
          <h2>Bilingual Dictation</h2>
          <p>Boliye ya likhiye — English + Hindi mein dikhaayega aur sunayega</p>
        </div>
      </div>

      {/* Input row */}
      <form className="dict-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder='Example: "The sun rises in the east"'
          value={manualText}
          onChange={(e) => setManual(e.target.value)}
          disabled={status === 'loading' || isListening}
        />
        <button type="submit" className="dict-btn primary" disabled={!manualText.trim() || status === 'loading'}>
          Translate
        </button>
        <button
          type="button"
          className={`dict-btn mic ${isListening ? 'listening' : ''}`}
          onClick={handleMic}
          aria-label={isListening ? 'Stop listening' : 'Speak to translate'}
        >
          {isListening ? '⏹ Stop' : '🎙️ Boliye'}
        </button>
      </form>

      {/* Status */}
      {status === 'listening' && (
        <div className="dict-status listening">🎙️ Sun raha hoon — sentence boliye...</div>
      )}
      {status === 'loading' && (
        <div className="dict-status loading">
          <span /><span /><span /> Translate kar raha hoon...
        </div>
      )}
      {status === 'error' && (
        <div className="dict-status error">⚠️ {error}</div>
      )}

      {/* Result */}
      {status === 'done' && result && (
        <div className="dict-result">
          {/* Side-by-side bilingual display */}
          <div className="dict-bilingual">
            <div className="dict-lang-card english">
              <span className="dict-lang-label">English</span>
              <p className="dict-lang-text">{result.english}</p>
            </div>
            <div className="dict-divider">⇄</div>
            <div className="dict-lang-card hindi">
              <span className="dict-lang-label">हिंदी</span>
              <p className="dict-lang-text hindi-text">{result.hindi}</p>
              <p className="dict-pronunciation">({result.pronunciation})</p>
              <button className="dict-replay" onClick={replayHindi} aria-label="Play Hindi audio">
                🔊 Suniye
              </button>
            </div>
          </div>

          {/* Word pairs table */}
          {result.word_pairs && result.word_pairs.length > 0 && (
            <div className="dict-word-pairs">
              <h3>Word-by-word</h3>
              <div className="dict-pairs-grid">
                {result.word_pairs.map((pair, i) => (
                  <div key={i} className="dict-pair">
                    <span className="dict-pair-en">{pair.english}</span>
                    <span className="dict-pair-arrow">→</span>
                    <span className="dict-pair-hi">{pair.hindi}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice prompt */}
          <div className="dict-practice-prompt">
            <span>✏️</span>
            <p>Students se boliye: Hindi mein likho aur English mein translate karo.</p>
          </div>
        </div>
      )}
    </div>
  );
}
