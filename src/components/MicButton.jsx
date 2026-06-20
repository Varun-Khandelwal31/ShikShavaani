export default function MicButton({ status, isListening, onPress }) {
  const active = status === 'listening' || isListening;
  return (
    <div className="mic-wrap">
      <button
        className={`mic-btn ${active ? 'listening' : 'idle'}`}
        type="button"
        onClick={onPress}
        aria-label={active ? 'Stop listening' : 'Start listening'}
      >
        <span className="mic-ring" aria-hidden="true" />
        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
          <path d="M12 14.5c1.8 0 3.2-1.45 3.2-3.24V6.1a3.2 3.2 0 0 0-6.4 0v5.16c0 1.79 1.42 3.24 3.2 3.24Z" />
          <path d="M18.35 10.7a.9.9 0 0 0-1.8 0 4.55 4.55 0 1 1-9.1 0 .9.9 0 0 0-1.8 0 6.35 6.35 0 0 0 5.45 6.28v2.22H8.8a.9.9 0 0 0 0 1.8h6.4a.9.9 0 0 0 0-1.8h-2.3v-2.22a6.35 6.35 0 0 0 5.45-6.28Z" />
        </svg>
      </button>
      <div className="mic-caption">{active ? 'Bolte rahiye...' : 'Press to speak'}</div>
    </div>
  );
}
