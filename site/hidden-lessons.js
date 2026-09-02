/**
 * Local-only lesson + phase hider (personal fork).
 *
 * Lets you remove lessons or whole phases from the site view without touching
 * the repo. Hidden items disappear from counts, stats, and the phase grid;
 * they stay restorable from a section at the bottom of the phase list (phases)
 * or the phase modal (lessons). Everything lives in localStorage on this
 * device. No network, no server.
 *
 * Schema:
 *
 *   aifs:hidden:v1 = {
 *     lessons:  { "<lesson-path>": { hiddenAt: number } },
 *     phases:   { "<phase-slug>":  { hiddenAt: number } },
 *     deferred: { "<phase-slug>":  { deferredAt: number } },
 *     order:    [ "<phase-slug>", ... ],
 *     updatedAt: number
 *   }
 *
 * `order` is an explicit study sequence. Phases named in it sort by their
 * position there; anything unnamed keeps its natural phase-id position after
 * them. Deferred phases always sink below both.
 *
 * Deferred phases are NOT hidden. They stay fully countable and clickable,
 * they just sort to the bottom of the contents list — for material you want
 * to reach eventually but not next.
 *
 * "<lesson-path>" matches data.js urls / progress.js keys
 * (e.g. "phases/00-setup-and-tooling/01-dev-environment").
 * "<phase-slug>" is the phase directory alone
 * (e.g. "00-setup-and-tooling").
 *
 * hidden-seed.js (loaded first) can pre-hide a curated set on a fresh
 * browser; see applySeed. Its one-shot marker lives in aifs:hidden:seed.
 */
(function () {
  var STORAGE_KEY = 'aifs:hidden:v1';
  var SEED_KEY = 'aifs:hidden:seed';
  var listeners = [];

  function emptyState() {
    return { lessons: {}, phases: {}, deferred: {}, order: [], unhidden: {}, updatedAt: 0 };
  }

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.lessons) return emptyState();
      // Older payloads predate phase hiding; normalise so callers never
      // have to null-check the map.
      if (!parsed.phases || typeof parsed.phases !== 'object') parsed.phases = {};
      if (!parsed.deferred || typeof parsed.deferred !== 'object') parsed.deferred = {};
      if (!Array.isArray(parsed.order)) parsed.order = [];
      if (!parsed.unhidden || typeof parsed.unhidden !== 'object') parsed.unhidden = {};
      return parsed;
    } catch (e) {
      return emptyState();
    }
  }

  function write(state) {
    state.updatedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // quota or disabled storage; fail silently
    }
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](); } catch (e) { /* listener error never breaks others */ }
    }
  }

  function extractPath(url) {
    var m = String(url || '').match(/(phases\/[^/]+\/[^/]+)\/?$/);
    return m ? m[1] : null;
  }

  function extractPhase(pathOrUrl) {
    var m = String(pathOrUrl || '').match(/phases\/([^/]+)/);
    return m ? m[1] : null;
  }

  function toLessonPath(pathOrUrl) {
    if (!pathOrUrl) return null;
    return pathOrUrl.indexOf('://') === -1 ? pathOrUrl : extractPath(pathOrUrl);
  }

  /** Explicitly hidden lesson, ignoring whether its phase is hidden. */
  function isLessonHidden(pathOrUrl) {
    var path = toLessonPath(pathOrUrl);
    if (!path) return false;
    return !!read().lessons[path];
  }

  function isPhaseHidden(phaseOrUrl) {
    var slug = extractPhase(phaseOrUrl) || phaseOrUrl;
    if (!slug) return false;
    return !!read().phases[slug];
  }

  /**
   * Effective visibility: a lesson is hidden if it was hidden directly OR its
   * phase was. Counting and filtering use this; the restore lists use
   * isLessonHidden so a hidden phase does not flood the lesson restore strip.
   */
  function isHidden(pathOrUrl) {
    if (!pathOrUrl) return false;
    var path = toLessonPath(pathOrUrl);
    if (!path) return false;
    var state = read();
    if (state.lessons[path]) return true;
    var slug = extractPhase(path);
    return !!(slug && state.phases[slug]);
  }

  function hiddenPaths() {
    return Object.keys(read().lessons);
  }

  function hiddenPhases() {
    return Object.keys(read().phases);
  }

  function hide(pathOrUrl) {
    var path = toLessonPath(pathOrUrl);
    if (!path) return;
    var state = read();
    state.lessons[path] = { hiddenAt: Date.now(), source: 'user' };
    delete state.unhidden['lesson:' + path];
    write(state);
  }

  function restore(pathOrUrl) {
    var path = toLessonPath(pathOrUrl);
    if (!path) return;
    var state = read();
    if (!state.lessons[path]) return;
    delete state.lessons[path];
    // Sticky: a later seed version must not re-hide what you restored.
    state.unhidden['lesson:' + path] = true;
    write(state);
  }

  function hidePhase(phaseOrUrl) {
    var slug = extractPhase(phaseOrUrl) || phaseOrUrl;
    if (!slug) return;
    var state = read();
    state.phases[slug] = { hiddenAt: Date.now(), source: 'user' };
    delete state.unhidden['phase:' + slug];
    write(state);
  }

  function restorePhase(phaseOrUrl) {
    var slug = extractPhase(phaseOrUrl) || phaseOrUrl;
    if (!slug) return;
    var state = read();
    if (!state.phases[slug]) return;
    delete state.phases[slug];
    state.unhidden['phase:' + slug] = true;
    write(state);
  }

  function isPhaseDeferred(phaseOrUrl) {
    var slug = extractPhase(phaseOrUrl) || phaseOrUrl;
    if (!slug) return false;
    return !!read().deferred[slug];
  }

  function deferredPhases() {
    return Object.keys(read().deferred);
  }

  function deferPhase(phaseOrUrl) {
    var slug = extractPhase(phaseOrUrl) || phaseOrUrl;
    if (!slug) return;
    var state = read();
    state.deferred[slug] = { deferredAt: Date.now(), source: 'user' };
    delete state.unhidden['defer:' + slug];
    write(state);
  }

  function undeferPhase(phaseOrUrl) {
    var slug = extractPhase(phaseOrUrl) || phaseOrUrl;
    if (!slug) return;
    var state = read();
    if (!state.deferred[slug]) return;
    delete state.deferred[slug];
    state.unhidden['defer:' + slug] = true;
    write(state);
  }

  function getOrder() {
    return read().order.slice();
  }

  function setOrder(slugs) {
    if (!Array.isArray(slugs)) return;
    var state = read();
    state.order = slugs.slice();
    write(state);
  }

  /**
   * Rank for sorting: position in the explicit order, or a large number that
   * preserves natural order for phases the sequence does not mention.
   */
  function orderRank(phaseOrUrl) {
    var slug = extractPhase(phaseOrUrl) || phaseOrUrl;
    var order = read().order;
    var idx = order.indexOf(slug);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  }

  function restoreAll() {
    write(emptyState());
  }

  function count() {
    return Object.keys(read().lessons).length;
  }

  function phaseCount() {
    return Object.keys(read().phases).length;
  }

  function onChange(fn) {
    if (typeof fn === 'function') listeners.push(fn);
  }

  /**
   * Apply window.AIFS_HIDDEN_SEED once per seed version.
   *
   * A version bump REPLACES the seed-sourced slice of state: every entry this
   * or an earlier seed created is dropped first, then the new set is applied.
   * Without that, a revised seed could only ever add, so lessons an older seed
   * cut stayed cut forever and the curated set silently drifted.
   *
   * Your own edits survive. Entries you created by hand are tagged
   * source:'user' and are never purged, and anything you restored by hand is
   * remembered in `unhidden` so a later seed will not re-hide it.
   *
   * Legacy entries carry no source tag; they predate this and all came from
   * seeds, so they are treated as seed-sourced and cleaned up.
   */
  function applySeed() {
    var seed = window.AIFS_HIDDEN_SEED;
    if (!seed || !seed.version) return;
    var marker;
    try {
      marker = localStorage.getItem(SEED_KEY);
    } catch (e) {
      return; // storage unavailable; nothing to seed into
    }
    if (marker === seed.version) return;

    var state = read();
    var stamp = Date.now();
    var i, key;

    // Drop everything a seed put here; keep what you did by hand.
    var purge = function (map) {
      for (var k in map) {
        if (Object.prototype.hasOwnProperty.call(map, k) && map[k].source !== 'user') delete map[k];
      }
    };
    purge(state.lessons);
    purge(state.phases);
    purge(state.deferred);

    // Order is one global setting, not a per-item delta, so it is replaced.
    state.order = Array.isArray(seed.order) ? seed.order.slice() : [];

    for (i = 0; i < (seed.phases || []).length; i++) {
      key = seed.phases[i];
      if (!state.unhidden['phase:' + key] && !state.phases[key]) {
        state.phases[key] = { hiddenAt: stamp, source: 'seed' };
      }
    }
    for (i = 0; i < (seed.lessons || []).length; i++) {
      key = seed.lessons[i];
      if (!state.unhidden['lesson:' + key] && !state.lessons[key]) {
        state.lessons[key] = { hiddenAt: stamp, source: 'seed' };
      }
    }
    for (i = 0; i < (seed.deferred || []).length; i++) {
      key = seed.deferred[i];
      if (!state.unhidden['defer:' + key] && !state.deferred[key]) {
        state.deferred[key] = { deferredAt: stamp, source: 'seed' };
      }
    }

    try {
      localStorage.setItem(SEED_KEY, seed.version);
    } catch (e) {
      return; // cannot stamp the marker, so do not write a half-applied state
    }
    write(state);
  }

  /** Hard reset: forget everything, including manual edits, and reseed. */
  function resetToSeed() {
    try {
      localStorage.removeItem(SEED_KEY);
    } catch (e) { /* storage unavailable */ }
    write(emptyState());
    applySeed();
  }

  window.AIFSHidden = {
    extractPath: extractPath,
    extractPhase: extractPhase,
    isHidden: isHidden,
    isLessonHidden: isLessonHidden,
    isPhaseHidden: isPhaseHidden,
    isPhaseDeferred: isPhaseDeferred,
    deferredPhases: deferredPhases,
    deferPhase: deferPhase,
    undeferPhase: undeferPhase,
    getOrder: getOrder,
    setOrder: setOrder,
    orderRank: orderRank,
    hiddenPaths: hiddenPaths,
    hiddenPhases: hiddenPhases,
    hide: hide,
    restore: restore,
    hidePhase: hidePhase,
    restorePhase: restorePhase,
    restoreAll: restoreAll,
    resetToSeed: resetToSeed,
    count: count,
    phaseCount: phaseCount,
    onChange: onChange
  };

  applySeed();
})();
