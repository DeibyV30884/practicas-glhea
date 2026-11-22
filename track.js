/* Registro de resultados para el panel del profesor.
   Nunca interrumpe la práctica: cualquier error se ignora y se reintenta luego. */
(function () {
  var C = window.FIREBASE_CONFIG;
  var enabled = !!(C && C.projectId && C.projectId !== 'TU_PROJECT_ID');
  var base = enabled ? 'https://firestore.googleapis.com/v1/projects/' + C.projectId +
    '/databases/(default)/documents/events?key=' + C.apiKey : '';
  var KEY = 'glhea_pending_events';
  var practice = (location.pathname.split('/').pop() || 'index').replace('.html', '') || 'index';
  var attempt = '';
  var pdoc = (enabled && C.studentKey) ? 'https://firestore.googleapis.com/v1/projects/' + C.projectId +
    '/databases/(default)/documents/progress/' + C.studentKey + '-' + practice + '?key=' + C.apiKey : '';
  var ptimer = 0, plast = null;
  function putProgress(obj) {
    if (!pdoc) return;
    var body = { fields: { data: { stringValue: obj ? JSON.stringify(obj) : '' }, ts: { integerValue: String(Date.now()) } } };
    try { fetch(pdoc, { method: 'PATCH', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(function () {}); } catch (e) {}
  }
  function flushProgress() { if (ptimer) { clearTimeout(ptimer); ptimer = 0; putProgress(plast); } }

  function rid() {
    var a = new Uint8Array(9);
    crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function clean(s, n) {
    return String(s == null ? '' : s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n || 300);
  }
  function fields(o) {
    var f = {};
    Object.keys(o).forEach(function (k) {
      var v = o[k];
      if (typeof v === 'boolean') f[k] = { booleanValue: v };
      else if (typeof v === 'number') f[k] = { integerValue: String(Math.round(v)) };
      else f[k] = { stringValue: String(v) };
    });
    return { fields: f };
  }
  function pending() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function savePending(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-300))); } catch (e) {} }
  function stash(ev) { var p = pending(); p.push(ev); savePending(p); }

  function send(ev) {
    return fetch(base, {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields(ev))
    }).then(function (r) { if (!r.ok) throw new Error(r.status); });
  }
  function push(ev) {
    if (!enabled) return;
    try { send(ev).catch(function () { stash(ev); }); } catch (e) { stash(ev); }
  }
  function flush() {
    if (!enabled) return;
    var p = pending(); if (!p.length) return;
    savePending([]);
    p.forEach(function (ev) { send(ev).catch(function () { stash(ev); }); });
  }

  window.TRACK = {
    loadProgress: function () {
      if (!pdoc) return Promise.resolve(null);
      return fetch(pdoc).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d || !d.fields || !d.fields.data) return null;
        try { return JSON.parse(d.fields.data.stringValue || 'null'); } catch (e) { return null; }
      }).catch(function () { return null; });
    },
    saveProgress: function (obj) {
      if (!pdoc) return; plast = obj; clearTimeout(ptimer);
      ptimer = setTimeout(function () { ptimer = 0; putProgress(plast); }, 600);
    },
    clearProgress: function () { clearTimeout(ptimer); ptimer = 0; plast = null; putProgress(null); },
    getAttempt: function () { return attempt; },
    setAttempt: function (id) { if (id) attempt = String(id); },
    begin: function () { try { attempt = rid(); flush(); push({ type: 'start', attempt: attempt, practice: practice, ts: Date.now() }); } catch (e) {} },
    answer: function (d) {
      try {
        if (!attempt) attempt = rid();
        push({
          type: 'answer', attempt: attempt, practice: practice, ts: Date.now(),
          section: clean(d.section, 120), qnum: d.qnum | 0,
          prompt: clean(d.prompt, 300), expected: clean(d.expected, 200), given: clean(d.given, 200),
          ok: !!d.ok, retry: !!d.retry, voice: !!d.voice
        });
      } catch (e) {}
    },
    done: function (score, total) {
      try { push({ type: 'done', attempt: attempt || rid(), practice: practice, ts: Date.now(), score: score | 0, total: total | 0 }); } catch (e) {}
    }
  };
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushProgress(); });
  window.addEventListener('pagehide', flushProgress);
  try { flush(); } catch (e) {}
})();
