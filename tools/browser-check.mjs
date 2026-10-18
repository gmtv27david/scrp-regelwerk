import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startPreview } from './serve.mjs';

// Reuse the installed, dependency-free browser driver; pass its path explicitly.
if (!process.argv[2]) throw new Error('Usage: node tools/browser-check.mjs <path-to-cdp.mjs>');
const { Browser } = await import(pathToFileURL(resolve(process.argv[2])).href);
const server = await startPreview(0);
const origin = `http://127.0.0.1:${server.address().port}`;
const base = `${origin}/scrp-regelwerk/`;
const browser = await Browser.launch();
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; console.log(`PASS ${message}`); }
try {
  const page = await browser.newPage();
  const external = new Set();
  const failures = [];
  await page.send('Network.enable');
  browser.on(page.sessionId, 'Network.requestWillBeSent', ({ request }) => {
    if (/^https?:/.test(request.url) && !request.url.startsWith(origin)) external.add(request.url);
  });
  browser.on(page.sessionId, 'Network.responseReceived', ({ response }) => { if (response.status >= 400) failures.push(`${response.status} ${response.url}`); });
  for (const file of ['index.html', 'regelwerk.html', 'impressum.html', 'datenschutz.html']) {
    await page.goto(base + file, { settleMs: 100 });
    check((await page.eval(() => document.querySelectorAll('main').length)) === 1, `${file}: one main landmark`);
    const links = await page.eval(() => [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.startsWith(location.origin)));
    for (const href of new Set(links)) {
      const url = new URL(href);
      const response = await fetch(url);
      assert.equal(response.status, 200, href);
      if (url.hash) assert.ok((await response.text()).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing anchor ${href}`);
    }
    checks++; console.log(`PASS ${file}: internal links and anchors`);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 900 });
      check(await page.eval(() => document.documentElement.scrollWidth <= innerWidth + 1), `${file}: no page overflow at ${width}px`);
    }
    check(page.consoleErrors.length === 0, `${file}: no JavaScript exceptions`);
  }
  check(external.size === 0, 'No third-party requests on page load');
  check(failures.length === 0, `No failed resources (${failures.join(', ')})`);
  await page.goto(base + 'regelwerk.html', { settleMs: 100 });
  check((await page.eval(() => document.querySelectorAll('.rule-chapter').length)) === 12, 'All twelve rule chapters retained');
  await page.eval(() => { const input = document.getElementById('rule-query'); input.value = 'UCLA'; input.dispatchEvent(new Event('input')); });
  check((await page.eval(() => [...document.querySelectorAll('.rule-chapter:not([hidden])')].map(el => el.id).join(','))) === 'k6,k11', 'Rule search returns both vehicle clauses');
  await page.eval(() => { const input = document.getElementById('rule-query'); input.value = 'xyz-no-match'; input.dispatchEvent(new Event('input')); });
  check(await page.eval(() => !document.querySelector('.empty-results').hidden), 'Search has a clear no-results state');
  await page.eval(() => { document.querySelector('.chapter-nav a[href="#k6"]').click(); });
  check(await page.eval(() => !document.getElementById('k6').hidden && document.getElementById('rule-query').value === ''), 'Chapter navigation clears incompatible filtering');
  await page.eval(() => document.getElementById('rule-reset').click());
  check((await page.eval(() => document.querySelectorAll('.rule-chapter:not([hidden])').length)) === 12, 'Search reset restores full rules');
  check(await page.eval(() => !/mp_m_freemode|mp_f_freemode|PED-Anpassung|LAPS|OPG/.test(document.querySelector('.rules-content').textContent)), 'No model restrictions or obsolete state factions');
  check(await page.eval(() => { const t = document.querySelector('.rules-content').textContent; return ['30 Minuten', '15 Minuten vor und nach', '30 Minuten vor und nach', '4 Personen', '6 Personen', 'Permanenter Bann', 'Permanenter Ausschluss'].every(s => t.includes(s)); }), 'Key time limits, group limits and sanctions retained');
  await page.goto(base + 'index.html#op-k6', { settleMs: 250 });
  check(await page.eval(() => location.pathname.endsWith('/regelwerk.html') && location.hash === '#k6'), 'Legacy rule hash redirects to the current rulebook');
  await page.goto(base + 'index.html#community', { settleMs: 100 });
  check(await page.eval(() => location.pathname.endsWith('/index.html') && location.hash === '#community'), 'Landing hashes are not redirected');
  check(await page.eval(() => document.querySelectorAll('.entry-copy .entry-points').length === 3 && document.querySelectorAll('.entry-photo').length === 3), 'Each entry section contains practical guidance and a real image');
  check(await page.eval(() => document.querySelectorAll('.community-context .context-block, .faction-rules .context-block').length === 4 && Boolean(document.querySelector('.support-guide'))), 'Previously sparse columns contain RP guidance and support information');
  await page.eval(async () => {
    document.querySelector('[data-scene="streets"]').click();
    for (let attempt = 0; attempt < 100; attempt++) {
      if (document.querySelector('[data-scene="streets"]').getAttribute('aria-pressed') === 'true') return;
      await new Promise(done => requestAnimationFrame(done));
    }
    throw new Error('Scene selection did not settle');
  });
  check(await page.eval(() => document.querySelector('[data-scene-image]').src.endsWith('/img/16.jpg') && document.querySelector('[data-scene="sunset"]').getAttribute('aria-pressed') === 'false'), 'Scene selector swaps real gameplay image and selected state');
  check(await page.eval(() => parseFloat(getComputedStyle(document.querySelector('.hero-image')).borderRadius) >= 20), 'Rounded image surfaces are active');
  await page.eval(() => { document.querySelector('[data-gallery-forward]').click(); });
  await page.eval(async () => { for (let i = 0; i < 60 && document.querySelector('.gallery-track').scrollLeft < 10; i++) await new Promise(done => requestAnimationFrame(done)); });
  check(await page.eval(() => document.querySelector('.gallery-track').scrollLeft > 0), 'Gallery arrow scrolls image strip');
  await page.eval(() => document.querySelectorAll('.faq-item summary')[1].click());
  check(await page.eval(() => document.querySelectorAll('.faq-item')[1].open), 'FAQ expands with native accessible control');
  await page.setViewport({ width: 390, height: 844, mobile: true });
  await page.eval(() => document.querySelector('.menu-toggle').click());
  check(await page.eval(() => document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true' && getComputedStyle(document.querySelector('.site-nav')).display !== 'none'), 'Mobile menu opens');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  check(await page.eval(() => document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false'), 'Escape closes mobile menu');
  await page.eval(() => document.querySelector('[data-gallery]').click());
  check(await page.eval(() => document.querySelector('dialog').open && document.activeElement.hasAttribute('data-close')), 'Gallery opens with focus inside native modal');
  await page.eval(() => document.querySelector('[data-next]').click());
  check(await page.eval(() => document.querySelector('.dialog-count').textContent === '2 / 5'), 'Gallery next control works');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
  check(await page.eval(() => document.querySelector('dialog').contains(document.activeElement)), 'Modal keyboard focus stays isolated');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await page.eval(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  check(await page.eval(() => !document.querySelector('dialog').open && document.activeElement.hasAttribute('data-gallery')), 'Escape closes gallery and restores focus');
  check(await page.eval(() => document.querySelector('[data-connect]').getAttribute('href') === '#server-hinweis'), 'Missing server destination has honest fallback');
  const script = await readFile(resolve('assets/js/site.js'), 'utf8');
  await page.eval(() => { window.SCRP_CONFIG = { server: 'https://cfx.re/join/example', discord: 'https://discord.gg/sVNPNm3pQf', socials: { youtube: 'https://www.youtube.com/' } }; });
  await page.eval(script);
  check(await page.eval(() => document.querySelector('[data-connect]').href === 'https://cfx.re/join/example'), 'Configured FiveM link becomes usable');
  check(await page.eval(() => [...document.querySelectorAll('.social-links a')].some(a => a.textContent === 'YouTube')), 'Configured social placeholder becomes a real link');
  const nojs = await browser.newPage({ width: 390, height: 844 });
  await nojs.send('Emulation.setScriptExecutionDisabled', { value: true });
  await nojs.goto(base + 'regelwerk.html', { settleMs: 100 });
  check((await nojs.eval(() => document.querySelectorAll('.rule-chapter:not([hidden])').length)) === 12, 'No-JS: full rules are available');
  check(await nojs.eval(() => getComputedStyle(document.querySelector('.site-nav')).display !== 'none'), 'No-JS: navigation remains usable');
  const reduced = await browser.newPage({ reducedMotion: true });
  await reduced.goto(base, { settleMs: 100 });
  check((await reduced.eval(() => document.getAnimations().length)) === 0, 'Reduced-motion disables movement');
  check(await reduced.eval(() => !document.querySelector('main').classList.contains('cinematic-motion')), 'Reduced-motion skips cinematic scroll effects');
  const cinematic = await browser.newPage({ width: 1440, height: 900 });
  await cinematic.goto(base, { settleMs: 100 });
  check(await cinematic.eval(() => document.querySelector('main').classList.contains('cinematic-motion')), 'Cinematic animation enhancement is enabled');
  check(await cinematic.eval(() => getComputedStyle(document.querySelector('.hero-stage')).position === 'sticky'), 'Immersive opening uses a short sticky camera sequence');
  await cinematic.eval(() => window.scrollTo({ top: 250, behavior: 'instant' }));
  await cinematic.eval(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done)))));
  check(await cinematic.eval(() => { const image = document.querySelector('[data-scene-image]'); return image.style.transform.includes('translate3d') && document.querySelector('.hero-stage').style.transform.includes('scale'); }), 'Hero camera and frame respond to native scroll');
  await cinematic.eval(() => { document.querySelector('.community-section').scrollIntoView({ behavior: 'instant' }); });
  await cinematic.eval(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done)))));
  check(await cinematic.eval(() => document.querySelector('.community-photo img').style.transform.includes('scale')), 'Visible gameplay image zoom follows scroll position');
  check(await cinematic.eval(() => document.getAnimations().some(animation => animation.effect.getKeyframes().some(key => key.transform?.includes('translate3d')))), 'Section text and image frames receive directional entrances');
  await cinematic.eval(() => {
    const card = document.querySelector('.faction-band figure');
    const rect = card.getBoundingClientRect();
    card.dispatchEvent(new PointerEvent('pointermove', { clientX: rect.left + rect.width * .8, clientY: rect.top + rect.height * .3 }));
  });
  await cinematic.eval(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  check(await cinematic.eval(() => document.querySelector('.faction-band figure').style.rotate.includes('deg')), 'Desktop faction images respond with spatial pointer tilt');
  await cinematic.eval(() => document.querySelector('.faction-band figure').dispatchEvent(new PointerEvent('pointerleave')));
  check(await cinematic.eval(() => document.querySelector('.faction-band figure').style.rotate === ''), 'Pointer tilt resets on leaving image');
  await cinematic.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  await cinematic.eval(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  check(await cinematic.eval(() => document.querySelector('.hero-stage').style.transform === '' && document.querySelector('.community-photo img').style.transform === ''), 'Pinch zoom suspends camera transforms');
  await cinematic.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
  await cinematic.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cinematic.eval(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  check(await cinematic.eval(() => !document.querySelector('main').classList.contains('cinematic-motion') && document.querySelector('.community-photo img').style.transform === ''), 'Changing reduced-motion live removes scroll transforms');
  check(cinematic.consoleErrors.length === 0, 'Cinematic scrolling has no JavaScript exceptions');
  await reduced.setViewport({ width: 720, height: 450 });
  check(await reduced.eval(() => document.documentElement.scrollWidth <= innerWidth + 1), '200%-equivalent viewport reflows without horizontal overflow');
  await mkdir('.taste-skill/checks', { recursive: true });
  await reduced.screenshot({ path: '.taste-skill/checks/reduced-motion.jpg' });
  const local = await browser.newPage();
  await local.goto(pathToFileURL(resolve('index.html')).href, { settleMs: 100 });
  check(local.consoleErrors.length === 0 && await local.eval(() => document.querySelector('h1').textContent.includes('Los Angeles')), 'Direct file opening renders without script errors');
  check((await fetch(origin + '/')).ok, 'Preview also serves site root');
  console.log(`\n${checks} browser checks passed.`);
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
