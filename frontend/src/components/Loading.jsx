export default function Loading({ fullScreen = false, label = 'Loading...' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-violet-300 ${fullScreen ? 'min-h-screen bg-black' : 'py-16'}`}
      role="status"
    >
      <div className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
