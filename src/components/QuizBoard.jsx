import { useEffect, useMemo, useState } from 'react';

const LETTERS = ['A', 'B', 'C', 'D'];
const COUNTDOWN_SECONDS = 30;

export default function QuizBoard({ data, onSpeak, onAnswer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const question = data.questions[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setTimeLeft(COUNTDOWN_SECONDS);
    setRevealed(false);
    setSelectedOption(null);
  }, [data]);

  useEffect(() => {
    if (!question || revealed) return undefined;
    if (timeLeft <= 0) {
      setRevealed(true);
      onSpeak?.(`Sahi jawab ${question.correct_option} hai. ${question.explanation}`, 'hi-IN');
      onAnswer?.(data.topic, false, data.questions.length);
      return undefined;
    }
    const timer = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [onAnswer, onSpeak, data, question, revealed, timeLeft]);

  const progress = useMemo(
    () => ((currentIndex + 1) / data.questions.length) * 100,
    [currentIndex, data.questions.length],
  );
  const ringProgress = Math.max(0, timeLeft / COUNTDOWN_SECONDS);
  const ringColor = timeLeft <= 3 ? '#ff6b6b' : timeLeft <= 6 ? '#ffd54f' : '#a5d6a7';

  const goNext = async () => {
    const next = currentIndex + 1;
    const nextIndex = next >= data.questions.length ? 0 : next;
    setCurrentIndex(nextIndex);
    setTimeLeft(COUNTDOWN_SECONDS);
    setRevealed(false);
    setSelectedOption(null);
    const nextQuestion = data.questions[nextIndex];
    await onSpeak?.(`Agla sawaal: ${nextQuestion.question_text}`, 'hi-IN');
  };

  const chooseOption = async (letter) => {
    if (revealed) return;
    setSelectedOption(letter);
    setRevealed(true);
    const correct = letter === question.correct_option;
    onAnswer?.(data.topic, correct, data.questions.length);
    const feedback = correct
      ? `Bilkul sahi! ${question.explanation}`
      : `Galat. Sahi jawab ${question.correct_option} tha. ${question.explanation}`;
    await onSpeak?.(feedback, 'hi-IN');
  };

  return (
    <article className="quiz-board">
      <div className="quiz-header">
        <div>
          <span>सवाल {currentIndex + 1} / {data.questions.length}</span>
          <h2>{data.topic}</h2>
        </div>
        <div
          className="timer-ring"
          style={{ '--progress': ringProgress, '--ring-color': ringColor }}
        >
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="timer-track" cx="60" cy="60" r="50" />
            <circle className="timer-progress" cx="60" cy="60" r="50" />
          </svg>
          <strong>{revealed ? '✓' : timeLeft}</strong>
        </div>
      </div>

      <div className="quiz-progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <p className="question-text">{question.question_text}</p>

      <div className="options-grid">
        {question.options.map((option, index) => {
          const letter = LETTERS[index];
          const correct = revealed && letter === question.correct_option;
          const incorrect =
            revealed && selectedOption === letter && letter !== question.correct_option;
          const muted =
            revealed && letter !== question.correct_option && selectedOption !== letter;
          return (
            <button
              className={`option-card ${correct ? 'correct' : ''} ${incorrect ? 'incorrect' : ''} ${muted ? 'muted' : ''}`}
              disabled={revealed}
              key={option}
              onClick={() => chooseOption(letter)}
              type="button"
            >
              <span>{letter}</span>
              <p>{option.replace(/^[A-D]\.\s*/i, '')}</p>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="answer-reveal">
          <div>
            <strong>
              {selectedOption === question.correct_option ? '✅ Sahi!' : `❌ Sahi jawab: ${question.correct_option}`}
            </strong>
            <p>{question.explanation}</p>
          </div>
          <button type="button" onClick={goNext}>
            Agla sawaal →
          </button>
        </div>
      )}
    </article>
  );
}
