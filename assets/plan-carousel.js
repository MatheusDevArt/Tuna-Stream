/* Horizontal plan selection never hijacks a vertical page gesture. */
(() => {
  const carousel = document.querySelector('.plan-carousel');
  const cards = [...carousel.querySelectorAll('.rank-plan')];
  const mobile = matchMedia('(max-width: 760px)');
  let current = 0;
  let start = null;
  function select(index) {
    const section = carousel.closest('section');
    const marker = section.previousElementSibling;
    const progress = Math.max(0, -marker.getBoundingClientRect().top);
    const wasVisible = section.getBoundingClientRect().top < innerHeight && section.getBoundingClientRect().bottom > 0;
    current = Math.max(0, Math.min(cards.length - 1, index));
    cards.forEach((card, i) => card.classList.toggle('is-current', i === current));
    carousel.querySelector('.plan-position').innerHTML = cards[current].querySelector('h3').textContent +
      ' <small>' + (current + 1) + ' / ' + cards.length + '</small>';
    document.dispatchEvent(new Event('sectionnavigate'));
    if (mobile.matches && wasVisible) requestAnimationFrame(() => {
      scrollTo({top: marker.getBoundingClientRect().top + scrollY + Math.min(progress, section.offsetHeight - innerHeight), behavior: 'instant'});
    });
  }
  carousel.addEventListener('pointerdown', event => {
    if (!mobile.matches || event.target.closest('a,button,input,select')) return;
    start = {x: event.clientX, y: event.clientY};
  });
  carousel.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) select(current + (dx < 0 ? 1 : -1));
  });
  carousel.addEventListener('pointercancel', () => start = null);
  carousel.addEventListener('keydown', event => {
    if (!mobile.matches || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault(); select(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  mobile.addEventListener('change', () => select(current));
  select(0);
})();
