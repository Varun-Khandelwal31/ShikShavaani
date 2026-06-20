export default function EmptyState({ mode }) {
  return (
    <div className="empty-state">
      <div className="empty-beam" />
      <h2>{mode === 'quiz' ? 'Quiz ke liye taiyar' : 'Concept samjhane ke liye taiyar'}</h2>
      <p>
        {mode === 'quiz'
          ? 'Mic dabaiye aur boliye: "5 questions banao gravity pe".'
          : 'Mic dabaiye aur boliye: "Photosynthesis samjhao".'}
      </p>
    </div>
  );
}
