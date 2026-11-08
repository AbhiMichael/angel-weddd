(() => {
  const loader = document.getElementById('invitation-loader');
  const started = performance.now();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dismissed = false;
  let fallback;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(fallback);
    window.removeEventListener('load', ready);
    setTimeout(() => {
      loader.classList.add('is-leaving');
      setTimeout(() => loader.remove(), reducedMotion ? 180 : 900);
    }, Math.max(0, (reducedMotion ? 0 : 2200) - (performance.now() - started)));
  }
  function ready() {
    // Fonts settle before the reveal, but never hold the invitation indefinitely.
    Promise.race([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(resolve => setTimeout(resolve, 1000))
    ]).then(dismiss);
  }
  fallback = setTimeout(dismiss, 8000);
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted) dismiss(); });
})();
