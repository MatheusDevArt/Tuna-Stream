(() => {
  const music = new Audio('assets/audio/in-dreamland-chillpeach.mp3');
  music.preload = 'metadata';
  music.volume = 0.15;
  music.loop = false;
  let started = false;

  function startAtMiddle() {
    if (started || !Number.isFinite(music.duration)) return;
    music.currentTime = music.duration / 2;
    music.play().then(() => {
      started = true;
      removeGestureFallback();
    }).catch(() => {
      // Mobile browsers may require a gesture before allowing sound.
    });
  }

  function removeGestureFallback() {
    document.removeEventListener('pointerdown', startAtMiddle);
    document.removeEventListener('keydown', startAtMiddle);
  }

  music.addEventListener('loadedmetadata', startAtMiddle, { once: true });
  music.addEventListener('ended', removeGestureFallback, { once: true });
  document.addEventListener('pointerdown', startAtMiddle);
  document.addEventListener('keydown', startAtMiddle);
  music.load();
})();
