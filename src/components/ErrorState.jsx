export default function ErrorState({ message }) {
  return (
    <div className="error-state">
      <div className="error-orb">!</div>
      <h2>Thoda sa issue aa gaya</h2>
      <p>{message}</p>
      <small>Mic permission, network connection, ya Chrome speech support check karein.</small>
    </div>
  );
}
