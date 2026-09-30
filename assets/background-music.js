(() => {
  const music = document.createElement('audio');
  music.src = 'assets/audio/in-dreamland-chillpeach.mp3';
  music.id = 'background-music'; music.preload = 'auto'; music.autoplay = true;
  music.volume = 0.15; music.loop = false; music.hidden = true;
  document.body.append(music);
  let positioned = false;
  let playing = false;
  let pending = false;
  function attemptPlayback() {
    if (playing || pending || music.ended || music.readyState < 1) return;
    if (!positioned && Number.isFinite(music.duration)) {music.currentTime = music.duration / 2; positioned = true;}
    pending = true;
    music.play().then(() => {playing = true; removeFallback();}).catch(() => {
      // Autoplay with sound depends on the browser's site permission.
    }).finally(() => {pending = false;});
  }
  function removeFallback() {
    document.removeEventListener('pointerdown', attemptPlayback);
    document.removeEventListener('keydown', attemptPlayback);
  }
  music.addEventListener('loadedmetadata', attemptPlayback, {once: true});
  music.addEventListener('canplay', attemptPlayback, {once: true});
  music.addEventListener('playing', () => {playing = true; removeFallback();}, {once: true});
  music.addEventListener('ended', removeFallback, {once: true});
  document.addEventListener('pointerdown', attemptPlayback);
  document.addEventListener('keydown', attemptPlayback);
  addEventListener('pageshow', attemptPlayback);
  music.load();
})();
