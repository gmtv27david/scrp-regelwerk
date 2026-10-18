(() => {
  'use strict';
  const main = document.querySelector('.landing-hero')?.closest('main');
  if (!main || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  const all = selector => [...main.querySelectorAll(selector)];
  const clamp = value => Math.min(1, Math.max(0, value));
  let dispose = () => {};

  function start() {
    dispose();
    if (preference.matches) return;

    const animations = new Set();
    const completed = new WeakSet();
    const revealItems = new Map();
    const visibleMedia = new Set();
    let frame = 0;
    let stopped = false;
    let waiting = false;
    const horizontal = mobile.matches ? 28 : 76;
    const vertical = mobile.matches ? 22 : 40;

    function collect(selector, direction, stagger = 0) {
      all(selector).forEach((element, index) => {
        revealItems.set(element, { direction, delay: (index % 3) * stagger });
      });
    }
    collect('.hero-intro', 'left');
    collect('.hero-main > p, .hero-main .actions', 'up', 70);
    collect('.community-statement h2, .community-statement p', 'left', 80);
    collect('.community-photo', 'right');
    collect('.section-copy .side-note', 'left');
    collect('.section-copy .reading-copy > *', 'right', 65);
    collect('.section-heading h2, .section-heading p', 'up', 65);
    collect('.faction-band > figure:first-child', 'left');
    collect('.faction-band > figure:nth-child(2)', 'up');
    collect('.faction-type', 'right');
    all('.entry-row').forEach((row, index) => {
      [...row.children].forEach((element, item) => {
        revealItems.set(element, { direction: index % 2 ? 'right' : 'left', delay: item * 75 });
      });
    });
    collect('.gallery-toolbar, .gallery-hint', 'up');
    collect('.faq-section > h2', 'left');
    collect('.faq-item', 'right', 55);
    collect('.connect-content > h2', 'left');
    collect('.connect-content > div > *', 'right', 65);

    const revealObserver = new IntersectionObserver(entries => {
      if (waiting || stopped) return;
      entries.forEach(entry => {
        if (!entry.isIntersecting || completed.has(entry.target)) return;
        const element = entry.target;
        completed.add(element);
        revealObserver.unobserve(element);
        const { direction, delay } = revealItems.get(element);
        const x = direction === 'left' ? -horizontal : direction === 'right' ? horizontal : 0;
        const y = direction === 'up' ? vertical : 0;
        const animation = element.animate([
          { opacity: .18, transform: `translate3d(${x}px, ${y}px, 0) scale(.985)` },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' }
        ], { duration: mobile.matches ? 750 : 1000, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation)).catch(() => {});
      });
    }, { threshold: .08, rootMargin: '0px 0px -3% 0px' });

    // Parent frames move once; the inner image independently follows native scrolling.
    const media = all('.community-photo img, .faction-band figure img, .connect-images img');
    const heroFrame = main.querySelector('.hero-image');
    const heroImage = main.querySelector('[data-scene-image]');
    const mediaObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleMedia.add(entry.target);
        else visibleMedia.delete(entry.target);
      });
      schedule();
    }, { rootMargin: '120px 0px' });

    function render() {
      frame = 0;
      if (stopped || document.hidden || waiting) return;
      const height = window.innerHeight;
      const targets = [...visibleMedia].map(element => {
        const rect = (element === heroFrame ? element : element.parentElement).getBoundingClientRect();
        const progress = clamp((height - rect.top) / (height + rect.height));
        return { element, rect, progress };
      });
      targets.forEach(({ element, rect, progress }) => {
        if (element === heroFrame) {
          const exit = clamp(-rect.top / Math.max(1, rect.height));
          element.style.transform = `scale(${(1 - exit * .035).toFixed(4)})`;
          return;
        }
        const scale = 1.15 - progress * .10;
        const drift = (progress - .5) * (mobile.matches ? 2 : 4);
        element.style.transform = `translate3d(0, ${drift.toFixed(3)}%, 0) scale(${scale.toFixed(4)})`;
      });
    }
    function schedule() {
      if (!frame && !stopped) frame = requestAnimationFrame(render);
    }
    function visibility() {
      if (document.hidden) animations.forEach(animation => animation.finish());
      else schedule();
    }

    main.classList.add('cinematic-motion');
    revealItems.forEach((_, element) => revealObserver.observe(element));
    media.forEach(element => mediaObserver.observe(element));
    if (heroFrame) mediaObserver.observe(heroFrame);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('visibilitychange', visibility);

    // Pinch/browser zoom is never intercepted; suspend travel while the visual viewport is magnified.
    function viewportChange() {
      waiting = Boolean(window.visualViewport && window.visualViewport.scale > 1.05);
      if (waiting) {
        animations.forEach(animation => animation.finish());
        media.forEach(element => element.style.removeProperty('transform'));
        heroFrame?.style.removeProperty('transform');
      } else {
        revealItems.forEach((_, element) => { if (!completed.has(element)) revealObserver.observe(element); });
        schedule();
      }
    }
    window.visualViewport?.addEventListener('resize', viewportChange, { passive: true });
    viewportChange();
    schedule();
    dispose = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      revealObserver.disconnect();
      mediaObserver.disconnect();
      animations.forEach(animation => animation.cancel());
      main.classList.remove('cinematic-motion');
      media.forEach(element => element.style.removeProperty('transform'));
      heroFrame?.style.removeProperty('transform');
      heroImage?.getAnimations().forEach(animation => animation.cancel());
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', visibility);
      window.visualViewport?.removeEventListener('resize', viewportChange);
    };
  }
  preference.addEventListener('change', start);
  start();
})();
