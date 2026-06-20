import { useState } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';
import TutorAvatar from '../components/TutorAvatar.jsx';

export default function ContentLibrary({ savedConcepts, savedQuizzes }) {
  const { speak, stop } = useSpeechSynthesis();
  const [tutorStatus, setTutorStatus] = useState('ready');
  const [playingId, setPlayingId] = useState(null);
  const [search, setSearch] = useState('');

  const replayConcept = async (concept, id) => {
    stop();
    setPlayingId(id);
    setTutorStatus('speaking');
    const script = [
      `${concept.topic}.`,
      concept.hinglish_explanation,
      ...(concept.key_points || []),
      `Yaad rakhne ka tarika: ${concept.fun_analogy}`,
    ].join(' ');
    await speak(script, 'hi-IN');
    setTutorStatus('ready');
    setPlayingId(null);
  };

  const replayQuiz = async (quiz, id) => {
    stop();
    setPlayingId(id);
    setTutorStatus('speaking');
    const questions = (quiz.questions || [])
      .slice(0, 2)
      .map((q) => `Sawaal: ${q.question_text}`)
      .join('. ');
    await speak(`${quiz.topic} quiz. ${questions}`, 'hi-IN');
    setTutorStatus('ready');
    setPlayingId(null);
  };

  const filteredConcepts = savedConcepts.filter((c) =>
    c.topic.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredQuizzes = savedQuizzes.filter((q) =>
    q.topic.toLowerCase().includes(search.toLowerCase()),
  );

  const isEmpty = savedConcepts.length === 0 && savedQuizzes.length === 0;

  return (
    <div className="page-root">
      <div className="page-header">
        <p className="workspace-kicker">Your saved materials</p>
        <h1>Content Library</h1>
        <p className="workspace-copy">
          Session mein generate kiye gaye concepts aur quizzes yahan save hote hain. Koi bhi dobara sunao.
        </p>
      </div>

      <div className="planner-tutor-row">
        <TutorAvatar status={tutorStatus} />
      </div>

      {isEmpty ? (
        <div className="reports-empty">
          <p>Library abhi khaali hai. Classroom mein concepts aur quizzes banao — woh yahan save honge.</p>
        </div>
      ) : (
        <>
          <div className="library-search">
            <input
              type="search"
              placeholder="Topic search karein..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search library"
            />
          </div>

          {filteredConcepts.length > 0 && (
            <section className="library-section">
              <h2>📚 Concepts ({filteredConcepts.length})</h2>
              <div className="library-cards">
                {filteredConcepts.map((c, i) => (
                  <div key={i} className="library-card">
                    <div className="library-card-emoji">{c.emoji_summary || '📖'}</div>
                    <div className="library-card-body">
                      <strong>{c.topic}</strong>
                      <p>{c.hinglish_explanation?.slice(0, 100)}...</p>
                      <span className={`difficulty-badge ${c.difficulty_level === 'beginner' ? 'green' : c.difficulty_level === 'advanced' ? 'violet' : 'blue'}`}>
                        {c.difficulty_level}
                      </span>
                    </div>
                    <button
                      className={`library-play-btn ${playingId === `c-${i}` ? 'playing' : ''}`}
                      onClick={() => replayConcept(c, `c-${i}`)}
                      aria-label={`Play ${c.topic}`}
                    >
                      {playingId === `c-${i}` ? '⏹' : '🔊'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredQuizzes.length > 0 && (
            <section className="library-section">
              <h2>❓ Quizzes ({filteredQuizzes.length})</h2>
              <div className="library-cards">
                {filteredQuizzes.map((q, i) => (
                  <div key={i} className="library-card">
                    <div className="library-card-emoji">🧩</div>
                    <div className="library-card-body">
                      <strong>{q.topic}</strong>
                      <p>{q.questions?.length || 0} questions</p>
                    </div>
                    <button
                      className={`library-play-btn ${playingId === `q-${i}` ? 'playing' : ''}`}
                      onClick={() => replayQuiz(q, `q-${i}`)}
                      aria-label={`Play ${q.topic} quiz`}
                    >
                      {playingId === `q-${i}` ? '⏹' : '🔊'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
