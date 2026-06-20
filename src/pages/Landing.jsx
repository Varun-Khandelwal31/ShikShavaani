import { useEffect, useRef, useState } from 'react';
import './Landing.css';

/* ── static data ─────────────────────────────── */
const FEATURES = [
  { icon: '🎙️', title: 'Voice-First Teaching',    desc: 'Boliye aur ShikshaVaani sun ke samjha dega — koi typing nahi, koi tech knowledge nahi.' },
  { icon: '🧠', title: 'Hinglish AI Tutor',        desc: 'Rural analogies use karta hai — khet, chulha, barsaat — taaki har bachcha samjhe.' },
  { icon: '❓', title: 'Instant Quiz Generator',   desc: 'Kisi bhi topic pe 4 MCQ sirf ek sawaal se. AI jawab bhi bol ke batata hai.' },
  { icon: '📅', title: 'Weekly Lesson Planner',    desc: 'Har din ke liye AI se lesson banao aur ek click mein apni class ko sunao.' },
  { icon: '📊', title: 'Session Reports',          desc: 'Quiz scores, topics, progress — sab ek jagah. Report bhi awaaz mein sunao.' },
  { icon: '📚', title: 'Content Library',          desc: 'Concepts aur quizzes save hote hain. Kabhi bhi kisi topic pe dobara playback karo.' },
];

const STEPS = [
  { n: '01', title: 'Topic boliye ya likhiye',      desc: '"Photosynthesis samjhao" ya "Gravity pe quiz banao"' },
  { n: '02', title: 'AI tutor sochta hai',           desc: 'Groq Llama ya Gemini se Hinglish explanation taiyaar hoti hai' },
  { n: '03', title: 'Awaaz mein padh ke sunata hai', desc: 'Animated tutor bol ke samjhata hai, har line highlight hoti hai' },
  { n: '04', title: 'Students quiz dete hain',       desc: 'Timer ke saath MCQ — sahi/galat feedback bhi awaaz mein' },
];

const TESTIMONIALS = [
  { q: 'Pehli baar bacchon ne science concept ek hi baar mein samjha. ShikshaVaani ki awaaz unhe bahut pasand aayi.', name: 'Sunita Devi',  role: 'Class 6 Teacher, Nuh Haryana' },
  { q: 'Lesson planner se meri Monday-Friday planning 10 minute mein ho jaati hai. Pehle ghanton lagte the.',         name: 'Ramesh Kumar', role: 'Science Teacher, Mahendragarh' },
  { q: 'Quiz feature se class mein engagement zyada ho gayi. Bacche timer dekh ke khud sawal padhne lagte hain.',     name: 'Priya Yadav',  role: 'Primary Teacher, Rewari' },
];

const STATS = [
  { v: '10x',   l: 'Faster lesson prep' },
  { v: 'Hindi', l: 'Native voice output' },
  { v: '5–8',   l: 'Grade optimised' },
  { v: '0 ₹',   l: 'Free to use' },
];

const PHRASES = [
  '"Photosynthesis samjhao class 6 ke liye"',
  '"Water cycle pe 4 questions banao"',
  '"Fractions ko roti se samjhao"',
  '"Gravity ki theory Hinglish mein"',
  '"Solar system ka quiz lo"',
];

const WAVE_H = [5, 12, 22, 30, 22, 30, 22, 12, 5];

/* ── small sub-components ────────────────────── */
function BigAvatar({ speaking }) {
  return (
    <div className={`lp-big-avatar${speaking ? ' speaking' : ''}`} aria-hidden="true">
      <div className="lp-big-glow" />
      <div className="lp-big-face">
        <div className="lp-big-eyes">
          <div className="lp-big-eye" />
          <div className="lp-big-eye" />
        </div>
        <div className="lp-big-mouth" />
      </div>
      <div className="lp-big-wave">
        {WAVE_H.map((h, i) => (
          <span key={i} style={{ '--h': h, '--d': `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────── */
export default function Landing({ onEnter }) {
  const [speaking, setSpeaking]     = useState(true);
  const [phraseIdx, setPhraseIdx]   = useState(0);
  const [visible, setVisible]       = useState(new Set());
  const secRefs = useRef([]);

  /* cycle demo phrases */
  useEffect(() => {
    const id = setInterval(() => {
      setSpeaking(true);
      setPhraseIdx(i => (i + 1) % PHRASES.length);
      setTimeout(() => setSpeaking(false), 2400);
    }, 3400);
    setTimeout(() => setSpeaking(false), 2400);
    return () => clearInterval(id);
  }, []);

  /* scroll-reveal */
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setVisible(p => new Set([...p, e.target.dataset.s]));
      }),
      { threshold: 0.1 },
    );
    secRefs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const ref = id => el => { secRefs.current[id] = el; };
  const vis = id => visible.has(String(id));

  return (
    <div className="lp-root">

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <div className="lp-nav-logo">SV</div>
          <span>ShikshaVaani</span>
        </div>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#reviews">Reviews</a>
        </div>
        <button className="lp-nav-cta" onClick={onEnter}>Launch App →</button>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true">
          <div className="lp-blob lp-blob-1" />
          <div className="lp-blob lp-blob-2" />
          <div className="lp-hero-grid" />
        </div>

        <div className="lp-hero-left">
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            AI-Powered · Hinglish · Voice-First
          </div>

          <h1 className="lp-hero-h1">
            Haryana ke<br />
            sarkari schools ka<br />
            <em>AI Teacher</em>
          </h1>

          <p className="lp-hero-sub">
            ShikshaVaani concepts samjhata hai, quizzes banata hai, aur awaaz
            mein padh ke sunata hai — bilkul ek real tutor ki tarah. Sirf
            boliye, baaki AI karega.
          </p>

          <div className="lp-hero-btns">
            <button className="lp-cta" onClick={onEnter}>
              🎙️ Abhi shuru karo — Free hai
            </button>
            <a href="#how" className="lp-cta-ghost">Kaise kaam karta hai? ↓</a>
          </div>

          <div className="lp-ticker">
            <span className="lp-ticker-label">Try:</span>
            <span className="lp-ticker-text" key={phraseIdx}>{PHRASES[phraseIdx]}</span>
          </div>
        </div>

        <div className="lp-hero-right">
          <BigAvatar speaking={speaking} />

          <div className="lp-float-card lp-fc-1">
            <span className="lp-float-card-icon">📖</span>
            <strong>Photosynthesis</strong>
            <p>Paudhe suraj ki roshni se khana banate hain — chulhe jaisa!</p>
          </div>
          <div className="lp-float-card lp-fc-2">
            <strong>✅ Bilkul sahi!</strong>
            <p>Chlorophyll hi green colour deta hai paudhon ko.</p>
          </div>
          <div className="lp-float-card lp-fc-3">
            <span className="lp-float-card-icon">🏆</span>
            <strong>Quiz Score</strong>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>3 / 4</p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="lp-stats">
        {STATS.map(s => (
          <div key={s.l} className="lp-stat">
            <strong>{s.v}</strong>
            <span>{s.l}</span>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section
        id="features"
        className={`lp-section lp-section-center${vis(0) ? ' in-view' : ''}`}
        ref={ref(0)} data-s="0"
      >
        <span className="lp-eyebrow">Features</span>
        <h2 className="lp-h2">Ek platform — poora classroom</h2>
        <p className="lp-subtext">
          Concept explain karo, quiz lo, lesson plan banao — sab kuch awaaz se, Hinglish mein.
        </p>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="lp-feat-card" style={{ transitionDelay: `${i * 0.06}s` }}>
              <div className="lp-feat-icon">{f.icon}</div>
              <strong>{f.title}</strong>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how"
        className={`lp-section lp-how-bg${vis(1) ? ' in-view' : ''}`}
        ref={ref(1)} data-s="1"
      >
        <div className="lp-how-inner">
          <div>
            <span className="lp-eyebrow">How it works</span>
            <h2 className="lp-h2">4 steps mein class shuru</h2>
            <div className="lp-steps">
              {STEPS.map((s, i) => (
                <div key={s.n} className="lp-step" style={{ transitionDelay: `${i * 0.09}s` }}>
                  <div className="lp-step-num">{s.n}</div>
                  <div>
                    <strong>{s.title}</strong>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* phone mock */}
          <div className="lp-phone">
            <div className="lp-phone-notch" />
            <div className="lp-phone-screen">
              <div className="lp-phone-avatar-wrap">
                <BigAvatar speaking={speaking} />
              </div>
              <div className="lp-phone-lines">
                <div className="lp-phone-line hi">📖 Photosynthesis</div>
                <div className="lp-phone-line">Paudhe suraj ki roshni se khana banate hain...</div>
                <div className="lp-phone-line">✦ Chlorophyll light absorb karta hai</div>
                <div className="lp-phone-line" style={{ opacity: .45 }}>✦ CO₂ + paani → glucose</div>
              </div>
              <div className="lp-phone-bar">
                <div className="lp-phone-bar-dot" />
                <span>Bol raha hoon...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        id="reviews"
        className={`lp-section lp-section-center${vis(2) ? ' in-view' : ''}`}
        ref={ref(2)} data-s="2"
      >
        <span className="lp-eyebrow">Reviews</span>
        <h2 className="lp-h2">Teachers ki baat</h2>
        <p className="lp-subtext">
          Haryana ke sarkari schools ke teachers jo roz ShikshaVaani use karte hain.
        </p>
        <div className="lp-testi-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="lp-testi-card" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="lp-stars">★★★★★</div>
              <p>"{t.q}"</p>
              <div className="lp-testi-author">
                <div className="lp-testi-av">{t.name[0]}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        className={`lp-section lp-cta-section${vis(3) ? ' in-view' : ''}`}
        ref={ref(3)} data-s="3"
      >
        <div className="lp-cta-glow" aria-hidden="true" />
        <h2>Aaj hi apni class mein ShikshaVaani laao</h2>
        <p>Free hai. Hindi mein hai. 30 second mein shuru ho jaata hai.</p>
        <button className="lp-cta" onClick={onEnter}>
          🎙️ Abhi Try Karo — No signup needed
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <div className="lp-nav-logo">SV</div>
          <span>ShikshaVaani</span>
        </div>
        <p>Haryana ke sarkari school teachers ke liye — pyaar se banaya gaya.</p>
        <p className="lp-footer-tech">Powered by Groq · Llama 3.3 70B &amp; Google Gemini</p>
      </footer>

    </div>
  );
}
