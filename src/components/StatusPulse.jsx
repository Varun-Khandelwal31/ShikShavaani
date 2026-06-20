const STATUS = {
  listening: { label: '🎙️ सुन रहा हूँ...', tone: 'blue' },
  thinking: { label: '🧠 सोच रहा हूँ...', tone: 'violet' },
  speaking: { label: '📢 बोल रहा हूँ...', tone: 'gold' },
  ready: { label: '✅ तैयार', tone: 'green' },
};

export default function StatusPulse({ status = 'ready' }) {
  const current = STATUS[status] || STATUS.ready;
  return <div className={`status-pulse ${current.tone}`}>{current.label}</div>;
}
