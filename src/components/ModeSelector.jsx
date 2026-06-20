export default function ModeSelector({ mode, onModeChange }) {
  return (
    <div className="mode-selector" role="group" aria-label="Teaching mode">
      <div className="panel-label">Mode Select</div>
      <button className={mode === 'concept' ? 'mode-btn active' : 'mode-btn'} onClick={() => onModeChange('concept')}>
        <span className="mode-icon">☄</span>
        <span>
          <strong>Concept</strong>
          <small>Samjhao</small>
        </span>
      </button>
      <button className={mode === 'quiz' ? 'mode-btn active' : 'mode-btn'} onClick={() => onModeChange('quiz')}>
        <span className="mode-icon">◈</span>
        <span>
          <strong>Quiz</strong>
          <small>Test lo</small>
        </span>
      </button>
    </div>
  );
}
