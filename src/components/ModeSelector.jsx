const MODES = [
  { id: 'concept',   icon: '☄',  label: 'Concept',    sub: 'Samjhao' },
  { id: 'quiz',      icon: '◈',  label: 'Quiz',        sub: 'Test lo' },
  { id: 'dictation', icon: '🌐', label: 'Dictation',   sub: 'Translate' },
  { id: 'activity',  icon: '⏱️', label: 'Activity',    sub: 'Guide + Timer' },
];

export default function ModeSelector({ mode, onModeChange }) {
  return (
    <div className="mode-selector" role="group" aria-label="Teaching mode">
      <div className="panel-label">Mode Select</div>
      {MODES.map((m) => (
        <button
          key={m.id}
          className={mode === m.id ? 'mode-btn active' : 'mode-btn'}
          onClick={() => onModeChange(m.id)}
          type="button"
        >
          <span className="mode-icon">{m.icon}</span>
          <span>
            <strong>{m.label}</strong>
            <small>{m.sub}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
