import { useCallback, useMemo, useRef, useState } from 'react';
import ModeSelector from './components/ModeSelector.jsx';
import MicButton from './components/MicButton.jsx';
import StatusPulse from './components/StatusPulse.jsx';
import ConceptCard from './components/ConceptCard.jsx';
import QuizBoard from './components/QuizBoard.jsx';
import TranscriptBar from './components/TranscriptBar.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import EmptyState from './components/EmptyState.jsx';
import TutorAvatar from './components/TutorAvatar.jsx';
import NarrationBox from './components/NarrationBox.jsx';
import DictationBoard from './components/DictationBoard.jsx';
import ActivityGuide from './components/ActivityGuide.jsx';
import LessonPlanner from './pages/LessonPlanner.jsx';
import Reports from './pages/Reports.jsx';
import ContentLibrary from './pages/ContentLibrary.jsx';
import Landing from './pages/Landing.jsx';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis.js';
import { explainConcept, generateQuiz, activeProvider } from './services/geminiService.js';

const QUICK_PROMPTS = [
  { mode: 'concept',   label: 'Photosynthesis samjhao', prompt: 'Photosynthesis class 6 ke liye Hinglish mein samjhao' },
  { mode: 'concept',   label: 'Fractions example',      prompt: 'Fractions ko roti ke example se samjhao' },
  { mode: 'quiz',      label: 'Water cycle quiz',        prompt: 'Water cycle par quiz banao' },
  { mode: 'quiz',      label: 'Gravity quiz',            prompt: 'Gravity par quiz banao class 7 ke liye' },
  { mode: 'dictation', label: 'Sun rises east',          prompt: 'The sun rises in the east' },
  { mode: 'activity',  label: '5 min group discussion',  prompt: '5 minute group discussion on water cycle' },
];

const NAV_ITEMS = [
  { id: 'classroom', label: 'Classroom', icon: '🏫' },
  { id: 'planner', label: 'Lesson Planner', icon: '📅' },
  { id: 'reports', label: 'Reports', icon: '📊' },
  { id: 'library', label: 'Content Library', icon: '📚' },
];

function getProviderLabel() {
  if (activeProvider === 'gemini') return 'Gemini 2.5 Flash';
  if (activeProvider === 'groq') return 'Groq · Llama 3.3 70B';
  return 'Auto (Gemini / Groq)';
}

function extractQuizTopic(transcript, fallbackTopic) {
  const cleaned = transcript
    .replace(/quiz|sawaal|sawal|test|banao|lo|karo|pe|par|questions?|question/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallbackTopic || transcript;
}

function formatStatus(status) {
  if (status === 'listening') return 'Listening';
  if (status === 'thinking') return 'Generating';
  if (status === 'speaking') return 'Speaking';
  return 'Ready';
}

// Split narration text into readable lines for NarrationBox
function buildNarrationLines(data, mode) {
  if (!data) return [];
  if (mode === 'concept') {
    return [
      `📖 ${data.topic}`,
      data.hinglish_explanation,
      ...(data.key_points || []).map((p) => `✦ ${p}`),
      `💡 ${data.fun_analogy}`,
    ].filter(Boolean);
  }
  if (mode === 'quiz') {
    return [
      `🧩 ${data.topic} — Quiz shuru!`,
      ...(data.questions || []).map((q, i) => `Sawaal ${i + 1}: ${q.question_text}`),
    ];
  }
  return [];
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [page, setPage] = useState('classroom');
  const [mode, setMode] = useState('concept');
  const [appStatus, setAppStatus] = useState('ready');
  const [conceptData, setConceptData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState([]);
  const [quizScores, setQuizScores] = useState([]);
  const [savedConcepts, setSavedConcepts] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [activeLine, setActiveLine] = useState(0);
  const [narrationLines, setNarrationLines] = useState([]);

  const activeLineRef = useRef(0);

  const { speak, stop } = useSpeechSynthesis();

  // Track which sentence is being spoken by finding charIndex in sentence chunks
  const onWord = useCallback((charIndex, sentence) => {
    // Each call is scoped to current sentence — find it in narrationLines
    const lines = narrationLines;
    const idx = lines.findIndex((l) => l.includes(sentence.slice(0, 20)));
    if (idx >= 0 && idx !== activeLineRef.current) {
      activeLineRef.current = idx;
      setActiveLine(idx);
    }
  }, [narrationLines]);

  const runTeachingFlow = useCallback(
    async (rawText, sourceMode = mode) => {
      const text = rawText.trim();
      if (!text) return;

      setError(null);
      setAppStatus('thinking');
      setPrompt('');
      setNarrationLines([]);
      setActiveLine(0);
      activeLineRef.current = 0;

      try {
        const lower = text.toLowerCase();
        const wantsQuiz =
          sourceMode === 'quiz' || /quiz|sawaal|sawal|test|questions?|agla sawaal/.test(lower);

        if (wantsQuiz) {
          setMode('quiz');
          const topic = extractQuizTopic(text, conceptData?.topic);
          const data = await generateQuiz(topic);
          setQuizData(data);
          setConceptData(null);
          setSavedQuizzes((prev) => [data, ...prev].slice(0, 20));
          setHistory((items) =>
            [
              { type: 'Quiz', title: data.topic, detail: `${data.questions.length} questions ready` },
              ...items,
            ].slice(0, 20),
          );

          const lines = buildNarrationLines(data, 'quiz');
          setNarrationLines(lines);
          setActiveLine(0);
          activeLineRef.current = 0;

          setAppStatus('speaking');
          // Speak intro + first question
          await speak(
            `${data.topic} pe quiz shuru hota hai. Pehla sawaal: ${data.questions[0].question_text}`,
            'hi-IN',
            onWord,
          );
          setAppStatus('ready');
          return;
        }

        setMode('concept');
        const data = await explainConcept(text);
        setConceptData(data);
        setQuizData(null);
        setSavedConcepts((prev) => [data, ...prev].slice(0, 20));
        setHistory((items) =>
          [
            { type: 'Concept', title: data.topic, detail: data.difficulty_level || 'beginner' },
            ...items,
          ].slice(0, 20),
        );

        const lines = buildNarrationLines(data, 'concept');
        setNarrationLines(lines);
        setActiveLine(0);
        activeLineRef.current = 0;

        setAppStatus('speaking');
        // Speak the full concept — sentence by sentence highlights via onWord
        const fullScript = [
          data.topic + '.',
          data.hinglish_explanation,
          ...(data.key_points || []),
          data.fun_analogy ? `Yaad rakhne ka tarika: ${data.fun_analogy}` : '',
        ]
          .filter(Boolean)
          .join(' ');

        // Advance lines manually sentence by sentence
        const sentences = [
          `📖 ${data.topic}`,
          data.hinglish_explanation,
          ...(data.key_points || []).map((p) => `✦ ${p}`),
          data.fun_analogy ? `💡 ${data.fun_analogy}` : null,
        ].filter(Boolean);

        for (let i = 0; i < sentences.length; i++) {
          setActiveLine(i);
          activeLineRef.current = i;
          const stripped = sentences[i].replace(/^[📖✦💡]\s*/, '');
          await speak(stripped, 'hi-IN');
        }

        setAppStatus('ready');
      } catch (err) {
        setError(err.message || 'Kuch gadbad ho gayi. Dobara try karein.');
        setAppStatus('ready');
      }
    },
    [conceptData?.topic, mode, onWord, speak],
  );

  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition({
    onResult: runTeachingFlow,
    onError: (message) => {
      setError(message);
      setAppStatus('ready');
    },
  });

  const handleMicPress = () => {
    // Unlock Chrome's autoplay policy on every user gesture
    if ('speechSynthesis' in window) window.speechSynthesis.resume();
    stop();
    if (isListening) {
      stopListening();
      setAppStatus('ready');
      return;
    }
    setError(null);
    setAppStatus('listening');
    startListening();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Unlock Chrome's autoplay policy on every user gesture
    if ('speechSynthesis' in window) window.speechSynthesis.resume();
    runTeachingFlow(prompt, mode);
  };

  const useQuickPrompt = (item) => {
    setMode(item.mode);
    setPrompt(item.prompt);
  };

  // Called from QuizBoard when a question is answered
  const handleQuizAnswer = useCallback((topic, correct, total) => {
    setQuizScores((prev) => {
      const existing = prev.findIndex((s) => s.topic === topic);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { topic, score: updated[existing].score + (correct ? 1 : 0), total };
        return updated;
      }
      return [...prev, { topic, score: correct ? 1 : 0, total }];
    });
  }, []);

  const status = isListening ? 'listening' : appStatus;
  const hasContent = conceptData || quizData || error || status === 'thinking';

  const liveTranscript = useMemo(
    () =>
      transcript ||
      prompt ||
      'Type a topic or press the mic. Example: "Photosynthesis samjhao" or "Quiz banao gravity pe".',
    [prompt, transcript],
  );

  return (
    <>
      {showLanding && <Landing onEnter={() => setShowLanding(false)} />}

      {!showLanding && (
        <div className="app-root">
          {/* ── Sidebar ── */}
          <aside className="platform-sidebar">
            <div className="brand-lockup">
              <div className="logo-mark" aria-hidden="true">SV</div>
              <div>
                <div className="brand-name">ShikshaVaani</div>
                <div className="brand-subtitle">AI Teaching Co-Pilot</div>
              </div>
            </div>

            <nav className="side-nav" aria-label="Platform navigation">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={page === item.id ? 'active' : ''}
                  onClick={() => setPage(item.id)}
                  type="button"
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="sidebar-card">
              <span>Today</span>
              <strong>AI classroom session</strong>
              <p>Hinglish mein concepts samjhao, quizzes lo, aur sab kuch awaaz se karo.</p>
            </div>
          </aside>

          {/* ── Pages ── */}
          {page === 'planner' && (
            <main className="workspace page-workspace">
              <LessonPlanner onSave={(data) => setSavedConcepts((prev) => [data, ...prev].slice(0, 20))} />
            </main>
          )}

          {page === 'reports' && (
            <main className="workspace page-workspace">
              <Reports history={history} quizScores={quizScores} />
            </main>
          )}

          {page === 'library' && (
            <main className="workspace page-workspace">
              <ContentLibrary savedConcepts={savedConcepts} savedQuizzes={savedQuizzes} />
            </main>
          )}

          {page === 'classroom' && (
            <main className="workspace" id="workspace">
              <header className="workspace-header">
                <div>
                  <p className="workspace-kicker">Government school teaching assistant</p>
                  <h1>Live Hinglish Learning Session</h1>
                  <p className="workspace-copy">
                    Topic boliye ya likhiye — ShikshaVaani samjhayega, quiz lega, aur awaaz mein padh ke sunayega.
                  </p>
                </div>
                <div className={`status-chip ${status}`}>
                  <span />
                  {formatStatus(status)}
                </div>
              </header>

              <section className="tutor-row" aria-label="AI Tutor">
                <TutorAvatar status={status} />
                <NarrationBox lines={narrationLines} activeLine={activeLine} status={status} />
              </section>

              <section className="command-center" aria-label="Teacher command center">
                <div className="command-panel">
                  <ModeSelector mode={mode} onModeChange={setMode} />
                  <form className="prompt-form" onSubmit={handleSubmit}>
                    <label htmlFor="teacher-prompt">Ask ShikshaVaani</label>
                    <div className="prompt-row">
                      <textarea
                        id="teacher-prompt"
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        placeholder={
                          mode === 'quiz'
                            ? 'Example: Solar system par quiz banao'
                            : 'Example: Evaporation ko simple Hinglish mein samjhao'
                        }
                        rows={3}
                      />
                      <button type="submit" disabled={status === 'thinking' || !prompt.trim()}>
                        Generate
                      </button>
                    </div>
                  </form>
                  <div className="quick-prompts" aria-label="Quick prompts">
                    {QUICK_PROMPTS.map((item) => (
                      <button key={item.label} type="button" onClick={() => useQuickPrompt(item)}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="voice-panel">
                  <MicButton status={status} isListening={isListening} onPress={handleMicPress} />
                  <StatusPulse status={status} />
                </div>
              </section>

              <section className="content-grid">
                <section className="display-area" aria-live="polite">
                  {status === 'thinking' && <LoadingState mode={mode} />}
                  {error && status !== 'thinking' && <ErrorState message={error} />}
                  {!error && status !== 'thinking' && mode === 'concept' && conceptData && (
                    <ConceptCard data={conceptData} onReplay={() => runTeachingFlow(conceptData.topic)} />
                  )}
                  {!error && status !== 'thinking' && mode === 'quiz' && quizData && (
                    <QuizBoard data={quizData} onSpeak={speak} onAnswer={handleQuizAnswer} />
                  )}
                  {mode === 'dictation' && <DictationBoard />}
                  {mode === 'activity'  && <ActivityGuide />}
                  {!hasContent && mode !== 'dictation' && mode !== 'activity' && <EmptyState mode={mode} />}
                </section>

                <aside className="session-panel" aria-label="Session details">
                  <section className="session-card">
                    <h2>Class context</h2>
                    <div className="stat-list">
                      {[
                        ['Class mode', 'Grades 5-8'],
                        ['Language', 'Hinglish'],
                        ['AI model', getProviderLabel()],
                        ['Topics today', savedConcepts.length],
                        ['Quizzes today', savedQuizzes.length],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="session-card">
                    <h2>Recent activity</h2>
                    {history.length === 0 ? (
                      <p className="muted-copy">Generated lessons and quizzes will appear here.</p>
                    ) : (
                      <div className="history-list">
                        {history.slice(0, 5).map((item, index) => (
                          <div key={`${item.title}-${index}`} className="history-item">
                            <span>{item.type}</span>
                            <strong>{item.title}</strong>
                            <p>{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </aside>
              </section>

              <TranscriptBar transcript={liveTranscript} isListening={isListening} />
            </main>
          )}
        </div>
      )}
    </>
  );
}
