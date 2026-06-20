/**
 * TutorAvatar — animated face with sound-wave bars.
 * Shows idle / listening / thinking / speaking states visually.
 */
export default function TutorAvatar({ status }) {
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';
  const isThinking = status === 'thinking';

  return (
    <div className={`tutor-avatar ${status}`} aria-hidden="true">
      {/* Face */}
      <div className="tutor-face">
        <div className="tutor-eyes">
          <div className={`tutor-eye ${isThinking ? 'thinking' : ''}`} />
          <div className={`tutor-eye ${isThinking ? 'thinking' : ''}`} />
        </div>
        <div className={`tutor-mouth ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`} />
      </div>

      {/* Sound wave bars — visible while speaking */}
      <div className={`tutor-wave ${isSpeaking ? 'active' : ''}`}>
        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
          <span key={i} style={{ '--bar-delay': `${i * 0.08}s`, '--bar-base': h }} />
        ))}
      </div>

      {/* Listening ring */}
      {isListening && <div className="tutor-listen-ring" />}

      {/* Label */}
      <div className="tutor-label">
        {isSpeaking && 'ShikshaVaani bol raha hai...'}
        {isListening && 'Shukriya, sun raha hoon...'}
        {isThinking && 'Soch raha hoon...'}
        {status === 'ready' && 'Taiyaar hoon!'}
      </div>
    </div>
  );
}
