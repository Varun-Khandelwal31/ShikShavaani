import { useEffect, useState } from 'react';

const conceptPhrases = ['Concept dhundh raha hoon...', 'Class ke level pe simplify kar raha hoon...', 'Soch raha hoon...'];
const quizPhrases = ['Quiz tayar kar raha hoon...', 'Options balance kar raha hoon...', 'Sahi jawab chhupa raha hoon...'];

export default function LoadingState({ mode }) {
  const phrases = mode === 'quiz' ? quizPhrases : conceptPhrases;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((value) => (value + 1) % phrases.length), 1400);
    return () => window.clearInterval(id);
  }, [phrases.length]);

  return (
    <div className="loading-state">
      <div className="thinking-dots" aria-hidden="true">
        <span>●</span>
        <span>●</span>
        <span>●</span>
      </div>
      <p>{phrases[index]}</p>
    </div>
  );
}
