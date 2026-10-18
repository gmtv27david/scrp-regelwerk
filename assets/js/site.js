(() => {
  'use strict';
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const config = window.SCRP_CONFIG || {};
  const rulesPage = Boolean(document.querySelector('.rules-content'));
  const normalizeHash = hash => hash.replace(/^#op-/, '#');
  const isRuleHash = hash => /^#(?:start|k(?:[2-9]|1[0-2]))$/.test(normalizeHash(hash));
  if (!rulesPage && document.querySelector('.landing-hero') && isRuleHash(location.hash)) {
    location.replace(`regelwerk.html${normalizeHash(location.hash)}`);
    return;
  }

  function validDestination(value, server = false) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value);
      if (server) {
        if (url.protocol === 'https:' && url.hostname === 'cfx.re' && /^\/join\/[a-z0-9]+\/?$/i.test(url.pathname)) return url.href;
        if (url.protocol === 'fivem:' && url.hostname === 'connect' && url.pathname.length > 1) return url.href;
        return null;
      }
      return url.protocol === 'https:' ? url.href : null;
    } catch { return null; }
  }
  const discord = validDestination(config.discord);
  if (discord) all('[data-discord]').forEach(link => { link.href = discord; });
  const server = validDestination(config.server, true);
  if (server) {
    all('[data-connect]').forEach(link => { link.href = server; });
    all('[data-connect-note]').forEach(note => { note.textContent = 'Der Verbindungslink öffnet FiveM. Dafür muss FiveM auf deinem Gerät installiert sein.'; });
    all('[data-join-answer]').forEach(answer => { answer.textContent = 'Nutze „Mit Server verbinden“ im Verbindungsbereich. Dafür muss FiveM installiert sein. Fragen zum Einstieg klärst du im Discord.'; });
  }
  all('[data-social]').forEach(placeholder => {
    const url = validDestination(config.socials?.[placeholder.dataset.social]);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.textContent = placeholder.textContent.split(' · ')[0];
    placeholder.replaceWith(link);
  });

  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-toggle');
  if (header && menu) {
    menu.hidden = false;
    header.classList.add('menu-ready');
    const closeMenu = () => { header.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menü'; };
    menu.addEventListener('click', () => {
      const open = header.classList.toggle('menu-open');
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? 'Schließen' : 'Menü';
    });
    all('.site-nav a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && header.classList.contains('menu-open')) { closeMenu(); menu.focus(); }
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
  }

  if (rulesPage) {
    const chapters = all('.rule-chapter');
    const field = document.getElementById('rule-query');
    const search = document.getElementById('rule-search');
    const status = document.getElementById('rule-results');
    const reset = document.getElementById('rule-reset');
    const normalize = text => text.toLocaleLowerCase('de').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
    const texts = chapters.map(chapter => normalize(chapter.textContent));
    const empty = document.createElement('p');
    empty.className = 'empty-results';
    empty.hidden = true;
    empty.textContent = 'Keine passenden Kapitel. Versuche einen anderen Begriff oder setze die Suche zurück.';
    document.querySelector('.rules-content').append(empty);
    function filter() {
      const terms = normalize(field.value.trim()).split(/\s+/).filter(Boolean);
      let count = 0;
      chapters.forEach((chapter, index) => {
        chapter.hidden = !terms.every(term => texts[index].includes(term));
        if (!chapter.hidden) count++;
      });
      empty.hidden = count !== 0;
      status.textContent = terms.length ? `${count} von ${chapters.length} Kapiteln gefunden. Die passenden Kapitel werden vollständig angezeigt.` : `Alle ${chapters.length} Kapitel werden angezeigt.`;
    }
    function revealHash() {
      const hash = normalizeHash(location.hash);
      if (!isRuleHash(hash)) return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      if (target.hidden && field) { field.value = ''; filter(); }
      all('.chapter-nav a').forEach(link => {
        if (link.hash === hash) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      if (location.hash !== hash) history.replaceState(null, '', hash);
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    if (field && search && status && reset) {
      field.addEventListener('input', filter);
      reset.addEventListener('click', () => { field.value = ''; filter(); field.focus(); });
      field.addEventListener('keydown', event => { if (event.key === 'Escape') { field.value = ''; filter(); } });
      search.hidden = false;
      filter();
      all('.chapter-nav a').forEach(link => link.addEventListener('click', () => {
        const target = document.getElementById(link.hash.slice(1));
        if (target?.hidden) { field.value = ''; filter(); }
      }));
    }
    window.addEventListener('hashchange', revealHash);
    revealHash();
  }

  const sceneImage = document.querySelector('[data-scene-image]');
  const sceneControls = document.querySelector('[data-scene-controls]');
  const sceneCaption = document.querySelector('[data-scene-caption]');
  if (sceneImage && sceneControls && sceneCaption) {
    const scenes = {
      sunset: { src: 'img/13.jpg', alt: 'LAFD-Löschfahrzeug am Strand im Sonnenuntergang – Spielaufnahme', caption: 'Feierabendlicht am Pazifik. Eine andere Seite von Los Angeles.' },
      streets: { src: 'img/16.jpg', alt: 'Blick aus einem Fahrzeug auf eine Palmenstraße – Spielaufnahme', caption: 'Zwischen Palmen und Kreuzungen. Jede Begegnung kann etwas verändern.' },
      patrol: { src: 'img/17.jpg', alt: 'LAPD-Streifenwagen auf einem Boulevard – Spielaufnahme', caption: 'Unterwegs mit dem LAPD. Auch ein Einsatz beginnt mit einer Geschichte.' }
    };
    let latestSelection = 0;
    const buttons = all('[data-scene]', sceneControls);
    buttons.forEach(button => button.addEventListener('click', async () => {
      const scene = scenes[button.dataset.scene];
      if (!scene) return;
      const selection = ++latestSelection;
      const nextImage = new Image();
      nextImage.src = scene.src;
      try { await nextImage.decode(); } catch { return; }
      if (selection !== latestSelection) return;
      sceneImage.src = scene.src;
      sceneImage.alt = scene.alt;
      sceneCaption.textContent = scene.caption;
      buttons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        sceneImage.getAnimations().forEach(animation => animation.cancel());
        sceneImage.animate([{ opacity: .45, transform: 'scale(1.025)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    }));
    sceneControls.hidden = false;
  }

  const track = document.querySelector('.gallery-track');
  const galleryControls = document.querySelector('[data-gallery-controls]');
  if (track && galleryControls) {
    const back = galleryControls.querySelector('[data-gallery-back]');
    const forward = galleryControls.querySelector('[data-gallery-forward]');
    const update = () => {
      back.disabled = track.scrollLeft < 2;
      forward.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    };
    const move = direction => track.scrollBy({ left: direction * track.clientWidth * .75, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    back.addEventListener('click', () => move(-1));
    forward.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    galleryControls.hidden = false;
    update();
  }

  const pictures = all('[data-gallery]');
  if (pictures.length && typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal) {
    const dialog = document.createElement('dialog');
    dialog.className = 'gallery-dialog';
    dialog.setAttribute('aria-label', 'Spielaufnahmen in der Großansicht');
    dialog.innerHTML = '<div class="dialog-top"><button type="button" data-close>Schließen</button></div><img alt=""><div class="dialog-controls"><button type="button" data-prev aria-label="Vorheriges Bild">Zurück</button><p class="dialog-caption" aria-live="polite"><span data-caption></span><span class="dialog-count"></span></p><button type="button" data-next aria-label="Nächstes Bild">Weiter</button></div>';
    document.body.append(dialog);
    const image = dialog.querySelector('img');
    let current = 0;
    let trigger = null;
    let previousOverflow = '';
    let swipeStart = null;
    function show(index) {
      current = (index + pictures.length) % pictures.length;
      image.src = pictures[current].href;
      image.alt = pictures[current].dataset.caption;
      dialog.querySelector('[data-caption]').textContent = image.alt;
      dialog.querySelector('.dialog-count').textContent = `${current + 1} / ${pictures.length}`;
    }
    pictures.forEach((link, index) => link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      show(index);
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      dialog.querySelector('[data-close]').focus();
    }));
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-prev]').addEventListener('click', () => show(current - 1));
    dialog.querySelector('[data-next]').addEventListener('click', () => show(current + 1));
    dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; trigger?.focus(); });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    });
    image.addEventListener('touchstart', event => { swipeStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }, { passive: true });
    image.addEventListener('touchend', event => {
      if (!swipeStart) return;
      const dx = event.changedTouches[0].clientX - swipeStart.x;
      const dy = event.changedTouches[0].clientY - swipeStart.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
      swipeStart = null;
    }, { passive: true });
  }

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!motion.matches && 'IntersectionObserver' in window) {
    // Animate only after intersection. Failed scripts never leave content hidden.
    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 70}ms`);
        entry.target.classList.add('reveal-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    all('[data-reveal]').forEach(element => observer.observe(element));
    motion.addEventListener('change', event => { if (event.matches) observer.disconnect(); });
  }
})();
