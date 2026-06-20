export default function TranscriptBar({ transcript, isListening }) {
  return (
    <footer className={`transcript-bar glass-card ${isListening ? 'live' : ''}`}>
      <span>{isListening ? 'Live transcript' : 'Teacher command'}</span>
      <p>{transcript}</p>
    </footer>
  );
}
