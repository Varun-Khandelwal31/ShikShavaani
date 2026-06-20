export default function Navbar({ status }) {
  return (
    <nav className="navbar glass-card">
      <div className="brand-lockup">
        <div className="logo-mark" aria-hidden="true">✦</div>
        <div>
          <div className="brand-name">ShikshaVaani</div>
          <div className="brand-subtitle">AI Teaching Co-Pilot</div>
        </div>
      </div>
      <div className={`live-chip ${status === 'thinking' ? 'busy' : ''}`}>
        <span />
        LIVE - AI Active
      </div>
    </nav>
  );
}
