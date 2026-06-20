import { useCallback, useEffect, useRef, useState } from 'react';
import { generateActivityGuide } from '../services/geminiService.js';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';

const QUICK_ACTIVITIES = [
  '5 minute group discussion on water cycle',
  '3 minute think-pair-share on fractions',
  'Draw and label a plant cell — 8 minutes',
  '10 minute peer quiz on solar system',
];

function fmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ActivityGuide() {
  const [uiState, setUiState]       = useState('idle'); // idle|loading|running|done
  const [guide, setGuide]           = useState(null);
  const [error, setError]           = useState('');
  const [input, setInput]           = useState('');
  const [stepIdx, setStepIdx]       = useState(0);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [paused, setPaused]         = useState(false);
  const [totalLeft, setTotalLeft]   = useState(0);
  const timerRef                    = useRef(null);

  const { speak, stop }             = useSpeechSynthesis();

  // ── clear timer on unmount ────────────────────────────────────────────────
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── per-step countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (uiState !== 'running' || paused) { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
      setTotalLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [uiState, paused, stepIdx]);

  // ── auto-advance when step timer hits 0 ──────────────────────────────────
  useEffect(() => {
    if (uiState !== 'running' || timeLeft !== 0 || !guide) return;
    const next = stepIdx + 1;
    if (next >= guide.steps.length) {
      setUiState('done');
      speak(guide.closing, 'hi-IN');
    } else {
      advanceToStep(next, guide);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const advanceToStep = useCallback(async (idx, g) => {
    const step = (g || guide).steps[idx];
    setStepIdx(idx);
    setTimeLeft(step.time_seconds);
    setPaused(false);
    await speak(step.instruction, 'hi-IN');
  }, [guide, speak]);

  const startGuide = useCallback(async (g) => {
    const total = g.steps.reduce((a, s) => a + s.time_seconds, 0);
    setTotalLeft(total);
    setGuide(g);
    setUiState('running');
    setStepIdx(0);
    setTimeLeft(g.steps[0].time_seconds);
    await speak(g.intro, 'hi-IN');
    await speak(g.steps[0].instruction, 'hi-IN');
  }, [speak]);

  const generate = useCallback(async (text) => {
    if (!text.trim()) return;
    setError('');
    setUiState('loading');
    try {
      const g = await generateActivityGuide(text);
      await startGuide(g);
    } catch (err) {
      setError(err.message || 'Activity guide nahi bana.');
      setUiState('idle');
    }
  }, [startGuide]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: (text) => generate(text),
    onError: (msg) => { setError(msg); setUiState('idle'); },
  });

  const handleMic = () => {
    stop();
    if (isListening) { stopListening(); return; }
    startListening();
  };

  const handleSubmit = (e) => { e.preventDefault(); generate(input); };

  const currentStep = guide?.steps[stepIdx];
  const progress    = guide ? ((stepIdx) / guide.steps.length) * 100 : 0;
  const totalTime   = guide?.total_seconds || 1;
  const totalProgress = ((totalTime - totalLeft) / totalTime) * 100;

  // ring for current step
  const ring = currentStep ? Math.max(0, timeLeft / currentStep.time_seconds) : 0;
  const ringColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#0f766e';

  return (
    <div className="activity-guide">
      <div className="activity-header">
        <div className="activity-icon">⏱️</div>
        <div>
          <h2>Hands-Free Activity Guide</h2>
          <p>Activity boliye — AI step-by-step guide banayega aur timer chalayega</p>
        </div>
      </div>

      {/* Input — only when idle/error */}
      {(uiState === 'idle' || uiState === 'error' || uiState === 'loading') && (
        <>
          <form className="activity-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder='Example: "5 minute group discussion on gravity"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={uiState === 'loading'}
            />
            <button type="submit" className="activity-btn primary"
              disabled={!input.trim() || uiState === 'loading'}>
              Generate
            </button>
            <button type="button"
              className={`activity-btn mic ${isListening ? 'listening' : ''}`}
              onClick={handleMic}>
              {isListening ? '⏹ Stop' : '🎙️ Boliye'}
            </button>
          </form>

          <div className="activity-quick-btns">
            {QUICK_ACTIVITIES.map((a) => (
              <button key={a} type="button" className="activity-quick-btn"
                onClick={() => { setInput(a); generate(a); }}>
                {a}
              </button>
            ))}
          </div>

          {uiState === 'loading' && (
            <div className="activity-status loading">
              <span /><span /><span /> Activity guide taiyaar ho raha hai...
            </div>
          )}
          {uiState === 'error' && (
            <div className="activity-status error">⚠️ {error}</div>
          )}
        </>
      )}

      {/* Running / Done state */}
      {(uiState === 'running' || uiState === 'done') && guide && (
        <div className="activity-runner">
          {/* Title + total progress */}
          <div className="activity-title-row">
            <h3>{guide.title}</h3>
            <span>{uiState === 'done' ? '✅ Done!' : `${fmt(totalLeft)} total left`}</span>
          </div>
          <div className="activity-total-bar">
            <div className="activity-total-fill" style={{ width: `${totalProgress}%` }} />
          </div>

          {/* Step progress dots */}
          <div className="activity-steps-dots">
            {guide.steps.map((s, i) => (
              <div key={i}
                className={`activity-dot ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}
                title={s.visual_cue}
              />
            ))}
          </div>

          {uiState === 'running' && currentStep && (
            <>
              {/* Current step card */}
              <div className="activity-step-card">
                <div className="activity-step-left">
                  <div className="activity-step-num">Step {currentStep.step_number}</div>
                  <div className="activity-step-cue">{currentStep.visual_cue}</div>
                  <p className="activity-step-instruction">{currentStep.instruction}</p>
                </div>

                {/* Circular timer */}
                <div className="activity-ring"
                  style={{ '--ring-progress': ring, '--ring-color': ringColor }}>
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <circle className="activity-ring-track" cx="60" cy="60" r="50" />
                    <circle className="activity-ring-fill"  cx="60" cy="60" r="50" />
                  </svg>
                  <div className="activity-ring-inner">
                    <strong>{fmt(timeLeft)}</strong>
                    <span>left</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="activity-controls">
                <button className="activity-ctrl-btn"
                  onClick={() => setPaused(p => !p)}>
                  {paused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button className="activity-ctrl-btn"
                  onClick={() => speak(currentStep.instruction, 'hi-IN')}>
                  🔊 Repeat
                </button>
                <button className="activity-ctrl-btn danger"
                  onClick={() => { stop(); clearInterval(timerRef.current); setUiState('idle'); setGuide(null); }}>
                  ✕ Stop
                </button>
              </div>
            </>
          )}

          {uiState === 'done' && (
            <div className="activity-done-card">
              <div className="activity-done-icon">🎉</div>
              <p>{guide.closing}</p>
              <button className="activity-btn primary"
                onClick={() => { setUiState('idle'); setGuide(null); setInput(''); }}>
                Nayi activity shuru karo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
