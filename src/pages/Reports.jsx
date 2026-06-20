import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';
import TutorAvatar from '../components/TutorAvatar.jsx';
import { useState } from 'react';

export default function Reports({ history, quizScores }) {
  const { speak, stop } = useSpeechSynthesis();
  const [tutorStatus, setTutorStatus] = useState('ready');

  const concepts = history.filter((h) => h.type === 'Concept');
  const quizzes = history.filter((h) => h.type === 'Quiz');
  const totalScore = quizScores.reduce((a, b) => a + b.score, 0);
  const maxScore = quizScores.reduce((a, b) => a + b.total, 0);
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const readReport = async () => {
    stop();
    setTutorStatus('speaking');
    const lines = [
      `Aaj ki class ki report sun lo.`,
      `Aaj tune ${concepts.length} concept seekhe aur ${quizzes.length} quiz diye.`,
      quizScores.length > 0
        ? `Quiz mein tune ${totalScore} mein se ${maxScore} mein se ${totalScore} sahi jawab diye. Yani ${pct} percent score.`
        : `Abhi koi quiz score nahi hai.`,
      concepts.length > 0
        ? `Aaj ke topics the: ${concepts.map((c) => c.title).join(', ')}.`
        : '',
      'Bahut accha kiya! Kal aur seekhenge.',
    ]
      .filter(Boolean)
      .join(' ');
    await speak(lines, 'hi-IN');
    setTutorStatus('ready');
  };

  return (
    <div className="page-root">
      <div className="page-header">
        <p className="workspace-kicker">Session performance</p>
        <h1>Reports</h1>
        <p className="workspace-copy">
          Is session mein kya pada, kitne quiz diye aur kya score raha — sab sunke samjho.
        </p>
      </div>

      <div className="planner-tutor-row">
        <TutorAvatar status={tutorStatus} />
        <button className="report-read-btn" onClick={readReport}>
          🔊 Report sunao
        </button>
      </div>

      <div className="reports-grid">
        <div className="report-stat-card">
          <div className="report-stat-icon">📚</div>
          <strong>{concepts.length}</strong>
          <span>Concepts</span>
        </div>
        <div className="report-stat-card">
          <div className="report-stat-icon">❓</div>
          <strong>{quizzes.length}</strong>
          <span>Quizzes</span>
        </div>
        <div className="report-stat-card">
          <div className="report-stat-icon">🏆</div>
          <strong>{maxScore > 0 ? `${pct}%` : '—'}</strong>
          <span>Quiz score</span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="reports-empty">
          <p>Abhi koi activity nahi hai. Classroom mein jaao aur padhna shuru karo!</p>
        </div>
      ) : (
        <div className="reports-timeline">
          <h2>Activity timeline</h2>
          {history.map((item, i) => (
            <div key={i} className={`timeline-item ${item.type.toLowerCase()}`}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <span>{item.type}</span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {quizScores.length > 0 && (
        <div className="quiz-score-table">
          <h2>Quiz results</h2>
          <table>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Score</th>
                <th>Percent</th>
              </tr>
            </thead>
            <tbody>
              {quizScores.map((qs, i) => (
                <tr key={i}>
                  <td>{qs.topic}</td>
                  <td>{qs.score}/{qs.total}</td>
                  <td>
                    <div className="score-bar-wrap">
                      <div
                        className="score-bar"
                        style={{ width: `${Math.round((qs.score / qs.total) * 100)}%` }}
                      />
                      <span>{Math.round((qs.score / qs.total) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
