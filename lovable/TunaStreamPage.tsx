/** Mount the static site intact: its document owns scroll, media and navigation. */
export default function TunaStreamPage() {
  return (
    <iframe
      src="/tuna-stream/index.html"
      title="Tuna Stream — serviços para sua live"
      allow="autoplay"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh', border: 0, background: '#080809' }}
    />
  );
}
