/* Finish a downward scroll at the next section without stacking or covering content. */
(() => {
  const sections = [...document.querySelectorAll('main > .screen')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let animation = 0;
  let settleTimer = 0;
  let armedUntil = 0;
  let cooldownUntil = 0;
  let touchStartY = null;
  const markerOf = section => section.previousElementSibling?.classList.contains('section-marker')
    ? section.previousElementSibling : section;

  function cancelAdvance() {
    cancelAnimationFrame(animation);
    clearTimeout(settleTimer);
    animation = 0;
    armedUntil = 0;
  }

  function scrollInside(target) {
    for (let node = target; node && node !== document.body; node = node.parentElement) {
      if (node.matches('input, select, textarea, form, dialog')) return true;
      const style = getComputedStyle(node);
      if (/auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2) return true;
    }
    return false;
  }

  function nextSectionInRange() {
    for (let i = 1; i < sections.length; i++) {
      const top = markerOf(sections[i]).getBoundingClientRect().top;
      if (top > 0 && top <= innerHeight * 0.72) return sections[i];
    }
    return null;
  }

  function advance(section) {
    const from = scrollY;
    const to = Math.min(
      markerOf(section).getBoundingClientRect().top + from,
      document.documentElement.scrollHeight - innerHeight,
    );
    if (to <= from + 2) return;

    const start = performance.now();
    const duration = Math.min(850, Math.max(480, (to - from) * 0.8));
    armedUntil = 0;
    clearTimeout(settleTimer);

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      scrollTo({ top: from + (to - from) * eased, behavior: 'instant' });
      if (progress < 1) {
        animation = requestAnimationFrame(tick);
      } else {
        animation = 0;
        cooldownUntil = performance.now() + 450;
        history.replaceState(null, '', '#' + section.id);
      }
    }
    animation = requestAnimationFrame(tick);
  }

  function considerAdvance() {
    if (animation || reducedMotion.matches || performance.now() > armedUntil ||
        performance.now() < cooldownUntil || document.querySelector('dialog[open]')) return;
    const next = nextSectionInRange();
    if (next) advance(next);
  }

  function settle() {
    clearTimeout(settleTimer);
    if (armedUntil) settleTimer = setTimeout(considerAdvance, 120);
  }

  addEventListener('wheel', event => {
    if (event.ctrlKey || event.defaultPrevented || reducedMotion.matches) return;
    if (animation) {
      if (event.deltaY < 0) cancelAdvance();
      else event.preventDefault();
      return;
    }
    if (event.deltaY <= 0 || scrollInside(event.target)) {
      armedUntil = 0;
      return;
    }
    if (performance.now() < cooldownUntil) return;
    armedUntil = performance.now() + 1200;
    settle();
  }, { passive: false });

  addEventListener('scroll', settle, { passive: true });
  addEventListener('touchstart', event => {
    cancelAdvance();
    touchStartY = scrollInside(event.target) ? null : event.touches[0]?.clientY;
  }, { passive: true });
  addEventListener('touchend', event => {
    if (touchStartY != null && touchStartY - event.changedTouches[0].clientY > 35) {
      armedUntil = performance.now() + 1800;
      settle();
    }
    touchStartY = null;
  }, { passive: true });

  document.addEventListener('sectionnavigate', cancelAdvance);
  addEventListener('keydown', event => {
    if (['Escape', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelAdvance();
  });
  addEventListener('resize', cancelAdvance);
  reducedMotion.addEventListener('change', cancelAdvance);
})();
