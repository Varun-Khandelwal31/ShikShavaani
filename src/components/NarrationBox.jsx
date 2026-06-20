/**
 * NarrationBox — scrolling ticker that shows what the tutor is currently saying.
 * The currently-spoken sentence is highlighted.
 */
export default function NarrationBox({ lines, activeLine, status }) {
  if (!lines || lines.length === 0) return null;

  return (
    <div className={`narration-box ${status === 'speaking' ? 'live' : ''}`}>
      <div className="narration-label">
        <span className="narration-dot" />
        ShikshaVaani bol raha hai
      </div>
      <div className="narration-lines">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`narration-line ${i === activeLine ? 'active' : i < activeLine ? 'done' : ''}`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
