import { useState } from 'react';
import { explainConcept } from '../services/geminiService.js';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';
import TutorAvatar from '../components/TutorAvatar.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SUBJECTS = ['Math', 'Science', 'Hindi', 'English', 'Social Studies', 'EVS'];

const INITIAL_PLAN = DAYS.map((day) => ({
  day,
  topic: '',
  subject: 'Science',
  lessonData: null,
  status: 'empty', // empty | loading | done | error
}));

export default function LessonPlanner({ onSave }) {
  const [plan, setPlan] = useState(INITIAL_PLAN);
  const [tutorStatus, setTutorStatus] = useState('ready');
  const { speak, stop } = useSpeechSynthesis();

  const updateCell = (index, field, value) => {
    setPlan((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const generateLesson = async (index) => {
    const row = plan[index];
    if (!row.topic.trim()) return;

    setPlan((prev) => prev.map((r, i) => (i === index ? { ...r, status: 'loading' } : r)));
    try {
      const data = await explainConcept(`${row.subject}: ${row.topic}`);
      setPlan((prev) =>
        prev.map((r, i) => (i === index ? { ...r, lessonData: data, status: 'done' } : r)),
      );
      if (onSave) onSave(data);
    } catch {
      setPlan((prev) => prev.map((r, i) => (i === index ? { ...r, status: 'error' } : r)));
    }
  };

  const readLesson = async (index) => {
    const row = plan[index];
    if (!row.lessonData) return;
    stop();
    setTutorStatus('speaking');
    const { topic, hinglish_explanation, key_points, fun_analogy } = row.lessonData;
    const script = [
      `Aaj hum ${topic} padhenge.`,
      hinglish_explanation,
      ...(key_points || []),
      `Yaad rakhne ka ek aasaan tarika: ${fun_analogy}`,
    ].join(' ');
    await speak(script, 'hi-IN');
    setTutorStatus('ready');
  };

  return (
    <div className="page-root">
      <div className="page-header">
        <p className="workspace-kicker">Weekly AI lesson builder</p>
        <h1>Lesson Planner</h1>
        <p className="workspace-copy">
          Har din ke liye topic type karein — AI lesson banayega aur ShikshaVaani usse padh kar sunayega.
        </p>
      </div>

      <div className="planner-tutor-row">
        <TutorAvatar status={tutorStatus} />
      </div>

      <div className="planner-grid">
        {plan.map((row, index) => (
          <div key={row.day} className={`planner-card ${row.status}`}>
            <div className="planner-card-head">
              <strong>{row.day}</strong>
              <select
                value={row.subject}
                onChange={(e) => updateCell(index, 'subject', e.target.value)}
                aria-label={`Subject for ${row.day}`}
              >
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Topic likhein..."
              value={row.topic}
              onChange={(e) => updateCell(index, 'topic', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateLesson(index)}
              aria-label={`Topic for ${row.day}`}
            />

            {row.status === 'empty' && (
              <button
                className="planner-btn primary"
                onClick={() => generateLesson(index)}
                disabled={!row.topic.trim()}
              >
                AI se banao
              </button>
            )}

            {row.status === 'loading' && (
              <div className="planner-loading">
                <span /><span /><span />
              </div>
            )}

            {row.status === 'done' && row.lessonData && (
              <div className="planner-lesson">
                <p className="planner-explanation">{row.lessonData.hinglish_explanation}</p>
                <ul className="planner-points">
                  {(row.lessonData.key_points || []).map((pt) => (
                    <li key={pt}>✦ {pt}</li>
                  ))}
                </ul>
                <div className="planner-actions">
                  <button className="planner-btn speak" onClick={() => readLesson(index)}>
                    🔊 Sunao
                  </button>
                  <button
                    className="planner-btn reset"
                    onClick={() =>
                      setPlan((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, status: 'empty', lessonData: null } : r,
                        ),
                      )
                    }
                  >
                    Badlo
                  </button>
                </div>
              </div>
            )}

            {row.status === 'error' && (
              <p className="planner-error">Kuch gadbad. Dobara try karein.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
