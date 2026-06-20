const toneByDifficulty = {
  beginner: 'green',
  intermediate: 'blue',
  advanced: 'violet',
};

export default function ConceptCard({ data, onReplay }) {
  const difficulty = data.difficulty_level || 'beginner';
  return (
    <article className="concept-card">
      <div className="concept-topline">
        <div className="emoji-summary">{data.emoji_summary || '📚✨'}</div>
        <div>
          <h2>{data.topic}</h2>
          <span className={`difficulty-badge ${toneByDifficulty[difficulty] || 'blue'}`}>
            {difficulty}
          </span>
        </div>
        {onReplay && (
          <button className="replay-btn" onClick={onReplay} aria-label="Replay explanation">
            🔊 Sunao
          </button>
        )}
      </div>

      <p className="explanation">{data.hinglish_explanation}</p>

      <ul className="key-points">
        {(data.key_points || []).slice(0, 3).map((point, index) => (
          <li key={point} style={{ '--delay': `${index * 0.15}s` }}>
            <span>✦</span>
            {point}
          </li>
        ))}
      </ul>

      <div className="analogy-callout">
        <strong>💡 Yaad rakhne ka tareeka</strong>
        <p>{data.fun_analogy}</p>
      </div>
    </article>
  );
}
