(function () {
  var root = document.documentElement;
  var stored = localStorage.getItem('theme');
  if (stored) {
    root.setAttribute('data-theme', stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }
  updateThemeIcon();

  document.addEventListener('DOMContentLoaded', function () {
    initThemeToggle();
    populateCurriculumSummary();
    populateStats();
    renderPhases();
    initStaggerIndex();
    initModal();
    initCopyButton();
    initMastheadFigure();
    initFadeObserver();
  });

  function populateCurriculumSummary() {
    if (typeof PHASES === 'undefined' || !Array.isArray(PHASES)) return;
    // Count the curated set, not everything on disk, so the masthead agrees
    // with the progress counter below it.
    var summary = computeStats();
    var values = {
      mastheadLessonCount: summary.lessons + ' lessons',
      mastheadPhaseCount: summary.phases + ' phases',
      prefaceLessonCount: summary.lessons + ' lessons',
      prefacePhaseCount: summary.phases + ' phases'
    };
    Object.keys(values).forEach(function (id) {
      var target = document.getElementById(id);
      if (target) target.textContent = values[id];
    });
  }

  function updateThemeIcon() {
    var icon = document.getElementById('themeIcon');
    if (!icon) return;
    var theme = root.getAttribute('data-theme');
    icon.textContent = theme === 'light' ? 'N' : 'D';
  }

  function initThemeToggle() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      var next = current === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeIcon();
    });
    updateThemeIcon();
  }

  // data.js carries no phase slug, so derive it from the first lesson URL
  // (.../phases/<slug>/<lesson>/) — that is the key hidden-lessons.js stores.
  function phaseSlug(p) {
    if (!p || !p.lessons) return null;
    for (var i = 0; i < p.lessons.length; i++) {
      if (!p.lessons[i].url) continue;
      var m = String(p.lessons[i].url).match(/phases\/([^/]+)/);
      if (m) return m[1];
    }
    return null;
  }

  function phaseIsHidden(p) {
    if (!window.AIFSHidden) return false;
    var slug = phaseSlug(p);
    return !!slug && window.AIFSHidden.isPhaseHidden(slug);
  }

  function phaseIsDeferred(p) {
    if (!window.AIFSHidden) return false;
    var slug = phaseSlug(p);
    return !!slug && window.AIFSHidden.isPhaseDeferred(slug);
  }

  /**
   * Every phase in its current logical order, hidden ones included.
   * The stored `order` may be empty or partial, so this materialises the full
   * sequence before any swap — otherwise nudging one phase up would yank it
   * past every phase the partial order never named.
   */
  function materialisedOrder() {
    var idx = [];
    for (var i = 0; i < PHASES.length; i++) idx.push(i);
    idx.sort(function (a, b) {
      var ra = window.AIFSHidden.orderRank(phaseSlug(PHASES[a]) || '');
      var rb = window.AIFSHidden.orderRank(phaseSlug(PHASES[b]) || '');
      return ra === rb ? a - b : ra - rb;
    });
    var slugs = [];
    for (var j = 0; j < idx.length; j++) slugs.push(phaseSlug(PHASES[idx[j]]) || '');
    return slugs;
  }

  function phaseBySlug(slug) {
    for (var i = 0; i < PHASES.length; i++) {
      if (phaseSlug(PHASES[i]) === slug) return PHASES[i];
    }
    return null;
  }

  /**
   * Swap a phase with its nearest neighbour in `dir` that sits in the same
   * group: visible, and on the same side of the deferred divider. Hidden
   * phases keep their slot but are stepped over, and a move never smuggles a
   * phase across the divider — that is what the defer control is for.
   */
  function movePhase(slug, dir) {
    if (!window.AIFSHidden) return;
    var slugs = materialisedOrder();
    var from = slugs.indexOf(slug);
    if (from === -1) return;

    var self = phaseBySlug(slug);
    var selfDeferred = phaseIsDeferred(self);

    for (var k = from + dir; k >= 0 && k < slugs.length; k += dir) {
      var other = phaseBySlug(slugs[k]);
      if (!other || phaseIsHidden(other)) continue;
      if (phaseIsDeferred(other) !== selfDeferred) return;
      slugs[from] = slugs[k];
      slugs[k] = slug;
      window.AIFSHidden.setOrder(slugs);
      return;
    }
  }

  function computeStats() {
    var totalLessons = 0;
    var completeLessons = 0;
    var hasProgress = !!window.AIFSProgress;
    var hasHidden = !!window.AIFSHidden;
    for (var i = 0; i < PHASES.length; i++) {
      if (hasHidden && phaseIsHidden(PHASES[i])) continue;
      var lessons = PHASES[i].lessons;
      for (var j = 0; j < lessons.length; j++) {
        if (hasHidden && window.AIFSHidden.isHidden(lessons[j].url)) continue;
        totalLessons++;
        var staticDone = lessons[j].status === 'complete';
        var userDone = false;
        if (hasProgress && lessons[j].url) {
          var lp = window.AIFSProgress.extractPath(lessons[j].url);
          if (lp) userDone = window.AIFSProgress.isLessonComplete(lp);
        }
        if (staticDone || userDone) completeLessons++;
      }
    }
    var completePhases = 0;
    var visiblePhases = 0;
    for (var p = 0; p < PHASES.length; p++) {
      if (hasHidden && phaseIsHidden(PHASES[p])) continue;
      visiblePhases++;
      if (PHASES[p].status === 'complete') completePhases++;
    }
    return {
      lessons: totalLessons,
      phases: visiblePhases,
      complete: completeLessons,
      completePhases: completePhases
    };
  }

  function setBar(selector, pct) {
    var el = document.querySelector(selector);
    if (!el) return;
    var clamped = Math.max(0, Math.min(100, pct));
    el.setAttribute('data-target-pct', clamped.toFixed(1));
    if (el.classList.contains('in-view') || !window.IntersectionObserver) {
      setBarScale(el, clamped);
    } else {
      setBarScale(el, 0);
    }
  }

  function setBarScale(el, pct) {
    var clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    el.style.setProperty('--bar-scale', (clamped / 100).toFixed(3));
  }

  function populateStats() {
    var stats = computeStats();
    var pct = stats.lessons > 0 ? (stats.complete / stats.lessons) * 100 : 0;
    var phasePct = stats.phases > 0 ? (stats.completePhases / stats.phases) * 100 : 0;
    var glossaryCount = (typeof GLOSSARY !== 'undefined') ? GLOSSARY.length : 0;

    setText('[data-stat="complete-frac"]', stats.complete + ' / ' + stats.lessons);
    setText('[data-stat="phases-frac"]', stats.completePhases + ' / ' + stats.phases);
    setText('[data-stat="glossary-count"]', String(glossaryCount));
    setBar('[data-bar="complete"]', pct);
    setBar('[data-bar="phases"]', phasePct);
    setBar('[data-bar="languages"]', 100);
    setBar('[data-bar="glossary"]', glossaryCount > 0 ? 100 : 0);
  }

  function setText(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function renderPhases() {
    var grid = document.getElementById('phasesGrid');
    if (!grid) return;
    var hasProgress = !!window.AIFSProgress;
    var hasHidden = !!window.AIFSHidden;
    var html = '';
    var hiddenRows = [];

    // Deferred phases stay fully visible and countable; they just sort to the
    // bottom so the next thing to study is always the top of the list.
    var order = [];
    var deferredOrder = [];
    for (var s = 0; s < PHASES.length; s++) {
      if (hasHidden && phaseIsHidden(PHASES[s])) {
        hiddenRows.push({ name: PHASES[s].name, slug: phaseSlug(PHASES[s]), id: PHASES[s].id });
        continue;
      }
      if (hasHidden && window.AIFSHidden.isPhaseDeferred(phaseSlug(PHASES[s]) || '')) {
        deferredOrder.push(s);
      } else {
        order.push(s);
      }
    }

    // An explicit study sequence overrides phase-number order. Phases the
    // sequence does not name keep their natural position after the named ones.
    if (hasHidden && window.AIFSHidden.getOrder().length > 0) {
      var rank = function (idx) { return window.AIFSHidden.orderRank(phaseSlug(PHASES[idx]) || ''); };
      var byOrder = function (a, b) {
        var ra = rank(a);
        var rb = rank(b);
        return ra === rb ? a - b : ra - rb;
      };
      order.sort(byOrder);
      deferredOrder.sort(byOrder);
    }

    order = order.concat(deferredOrder);
    var firstDeferred = order.length - deferredOrder.length;

    for (var o = 0; o < order.length; o++) {
      var i = order[o];
      var p = PHASES[i];
      var isDeferred = o >= firstDeferred;
      var total = 0;
      var done = 0;
      for (var j = 0; j < p.lessons.length; j++) {
        if (hasHidden && window.AIFSHidden.isHidden(p.lessons[j].url)) continue;
        total++;
        var staticDone = p.lessons[j].status === 'complete';
        var userDone = false;
        if (hasProgress && p.lessons[j].url) {
          var lp = window.AIFSProgress.extractPath(p.lessons[j].url);
          if (lp) userDone = window.AIFSProgress.isLessonComplete(lp);
        }
        if (staticDone || userDone) done++;
      }
      var statusClass = p.status.replace(/ /g, '-');
      var roman = toRoman(p.id);
      var num = String(p.id).padStart(2, '0');

      if (o === firstDeferred && deferredOrder.length > 0) {
        html += '<div class="toc-defer-divider"><span>Deferred to the end (' + deferredOrder.length + ')</span></div>';
      }

      html += '<div class="toc-row' + (isDeferred ? ' is-deferred' : '') + '" data-phase="' + i + '" role="button" tabindex="0" aria-haspopup="dialog" aria-label="Open Phase ' + num + ': ' + escapeHtml(p.name) + (isDeferred ? ' (deferred to the end)' : '') + '">';
      html += '<span class="toc-num">' + roman + '.</span>';
      html += '<div><span class="toc-status ' + statusClass + '"></span><span class="toc-name">' + escapeHtml(p.name) + '</span>' + (isDeferred ? '<span class="toc-later">later</span>' : '') + '</div>';
      html += '<span class="toc-meta">' + done + ' / ' + total + '</span>';
      html += '<span class="toc-meta">' + num + '</span>';
      if (hasHidden) {
        var slugAttr = escapeHtml(phaseSlug(p) || '');
        var nameAttr = escapeHtml(p.name);
        // First and last of a group have nowhere to go in one direction.
        var groupStart = isDeferred ? firstDeferred : 0;
        var groupEnd = isDeferred ? order.length - 1 : firstDeferred - 1;
        html += '<span class="toc-actions">';
        html += '<button type="button" class="toc-move" data-slug="' + slugAttr + '" data-dir="-1"' + (o <= groupStart ? ' disabled' : '') + ' title="Move up" aria-label="Move up: ' + nameAttr + '">↑</button>';
        html += '<button type="button" class="toc-move" data-slug="' + slugAttr + '" data-dir="1"' + (o >= groupEnd ? ' disabled' : '') + ' title="Move down" aria-label="Move down: ' + nameAttr + '">↓</button>';
        html += '<button type="button" class="toc-defer" data-slug="' + slugAttr + '" data-deferred="' + (isDeferred ? '1' : '0') + '" title="' + (isDeferred ? 'Move back into the main sequence' : 'Send this phase to the end of the list') + '" aria-label="' + (isDeferred ? 'Un-defer phase: ' : 'Send phase to the end: ') + nameAttr + '">' + (isDeferred ? '⤒' : '⤓') + '</button>';
        html += '<button type="button" class="toc-hide" data-slug="' + slugAttr + '" data-name="' + nameAttr + '" title="Remove this phase from the course view" aria-label="Delete phase: ' + nameAttr + '">✕</button>';
        html += '</span>';
      } else {
        html += '<span></span>';
      }
      html += '</div>';
    }

    if (hiddenRows.length > 0) {
      html += '<div class="toc-hidden-section"><span class="toc-hidden-label">Deleted phases (' + hiddenRows.length + ') — click to restore:</span>';
      for (var q = 0; q < hiddenRows.length; q++) {
        html += '<button type="button" class="toc-hidden-restore" data-slug="' + escapeHtml(hiddenRows[q].slug || '') + '" title="Restore this phase">' + String(hiddenRows[q].id).padStart(2, '0') + ' · ' + escapeHtml(hiddenRows[q].name) + '</button>';
      }
      html += '</div>';
    }

    grid.innerHTML = html;

    var phaseHideBtns = grid.querySelectorAll('.toc-hide');
    for (var hb = 0; hb < phaseHideBtns.length; hb++) {
      phaseHideBtns[hb].addEventListener('click', function (e) {
        // The whole row is a button that opens the modal; stop it here.
        e.preventDefault();
        e.stopPropagation();
        var slug = this.getAttribute('data-slug');
        if (!slug || !window.AIFSHidden) return;
        if (window.confirm('Delete the whole "' + this.getAttribute('data-name') + '" phase from the course view?\n\nEvery lesson in it drops out of the counts. You can restore it from the "Deleted phases" strip at the bottom of this list.')) {
          window.AIFSHidden.hidePhase(slug);
        }
      });
    }

    var moveBtns = grid.querySelectorAll('.toc-move');
    for (var mb = 0; mb < moveBtns.length; mb++) {
      moveBtns[mb].addEventListener('click', function (e) {
        // The whole row is a button that opens the modal; stop it here.
        e.preventDefault();
        e.stopPropagation();
        if (this.disabled) return;
        movePhase(this.getAttribute('data-slug'), parseInt(this.getAttribute('data-dir'), 10));
      });
    }

    var deferBtns = grid.querySelectorAll('.toc-defer');
    for (var db = 0; db < deferBtns.length; db++) {
      deferBtns[db].addEventListener('click', function (e) {
        // The whole row is a button that opens the modal; stop it here.
        e.preventDefault();
        e.stopPropagation();
        var slug = this.getAttribute('data-slug');
        if (!slug || !window.AIFSHidden) return;
        if (this.getAttribute('data-deferred') === '1') {
          window.AIFSHidden.undeferPhase(slug);
        } else {
          window.AIFSHidden.deferPhase(slug);
        }
      });
    }

    var phaseRestoreBtns = grid.querySelectorAll('.toc-hidden-restore');
    for (var pr = 0; pr < phaseRestoreBtns.length; pr++) {
      phaseRestoreBtns[pr].addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var slug = this.getAttribute('data-slug');
        if (!slug || !window.AIFSHidden) return;
        window.AIFSHidden.restorePhase(slug);
      });
    }

    // Re-apply per-row stagger delays for the freshly created rows.
    initStaggerIndex();

    // If the reveal observer has already initialised (body.js-anim is set),
    // the IntersectionObserver is only watching the *original* rows it was
    // given at startup. Re-rendering via innerHTML replaces those nodes with
    // brand-new elements that are NOT being observed, so they would otherwise
    // stay hidden forever under `body.js-anim .toc-row { opacity: 0 }`.
    //
    // Since the user has already seen the initial reveal animation, just mark
    // the rebuilt rows as visible immediately (no second fade-in).
    if (document.body.classList.contains('js-anim')) {
      var newRows = grid.querySelectorAll('.toc-row');
      for (var r = 0; r < newRows.length; r++) {
        newRows[r].classList.add('in-view', 'visible');
      }
    }
  }

  function toRoman(num) {
    var lookup = [
      ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
      ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
      ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
    ];
    var n = parseInt(num, 10);
    if (isNaN(n) || n <= 0) return String(num);
    var out = '';
    for (var k = 0; k < lookup.length; k++) {
      while (n >= lookup[k][1]) {
        out += lookup[k][0];
        n -= lookup[k][1];
      }
    }
    return out;
  }

  function initModal() {
    var overlay = document.getElementById('modalOverlay');
    var modal = document.getElementById('modal');
    var closeBtn = document.getElementById('modalClose');
    if (!overlay || !modal || !closeBtn) return;

    overlay.setAttribute('aria-hidden', 'true');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modalTitle');
    modal.setAttribute('aria-describedby', 'modalDesc');
    closeBtn.setAttribute('aria-label', 'Close phase details');

    document.addEventListener('click', function (e) {
      var row = e.target.closest('.toc-row, .phase-card');
      if (row) {
        var idx = parseInt(row.getAttribute('data-phase'), 10);
        if (!isNaN(idx)) openModal(idx, false);
      }
    });

    document.addEventListener('keydown', function (e) {
      var row = e.target.closest && e.target.closest('.toc-row, .phase-card');
      if (!row || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      var idx = parseInt(row.getAttribute('data-phase'), 10);
      if (!isNaN(idx)) openModal(idx, true);
    });

    closeBtn.addEventListener('click', function () { closeModal(false); });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal(true);
        return;
      }
      if (e.key !== 'Tab' || !overlay.classList.contains('open')) return;
      var focusable = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    var delPhaseBtn = document.getElementById('modalDeletePhase');
    if (delPhaseBtn) {
      delPhaseBtn.addEventListener('click', function () {
        var slug = this.getAttribute('data-slug');
        if (!slug || !window.AIFSHidden) return;
        if (!window.confirm('Delete the whole "' + this.getAttribute('data-name') + '" phase from the course view?\n\nEvery lesson in it drops out of the counts. You can restore it from the "Deleted phases" strip at the bottom of the phase list.')) return;
        window.AIFSHidden.hidePhase(slug);
        closeModal(false);
      });
    }

    var resetBtn = document.getElementById('modalReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!window.AIFSProgress) return;
        var ok = window.confirm('Clear all your local progress (quiz answers and completed lessons)? This cannot be undone.');
        if (!ok) return;
        window.AIFSProgress.reset();
      });
    }
  }

  var currentPhaseIdx = -1;
  var modalReturnFocus = null;

  function openModal(idx, fromKeyboard) {
    var p = PHASES[idx];
    if (!p) return;
    currentPhaseIdx = idx;
    modalReturnFocus = document.activeElement;

    document.getElementById('modalPhaseNum').textContent = 'PHASE ' + String(p.id).padStart(2, '0');
    document.getElementById('modalTitle').textContent = p.name;
    document.getElementById('modalDesc').textContent = p.desc;

    var delPhase = document.getElementById('modalDeletePhase');
    if (delPhase) {
      var slug = phaseSlug(p);
      if (window.AIFSHidden && slug) {
        delPhase.style.display = '';
        delPhase.setAttribute('data-slug', slug);
        delPhase.setAttribute('data-name', p.name);
      } else {
        delPhase.style.display = 'none';
      }
    }

    renderModalLessons(p);

    var overlay = document.getElementById('modalOverlay');
    overlay.classList.toggle('no-motion', !!fromKeyboard);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var close = document.getElementById('modalClose');
      if (close) close.focus();
      overlay.classList.remove('no-motion');
    });
  }

  function renderModalLessons(p) {
    var container = document.getElementById('modalLessons');
    if (!container) return;

    var hasProgress = !!window.AIFSProgress;
    var hasHidden = !!window.AIFSHidden;
    var userDone = 0;
    var visibleLessons = 0;
    var html = '';

    for (var i = 0; i < p.lessons.length; i++) {
      var l = p.lessons[i];
      var pathMatch = l.url ? l.url.match(/(phases\/[^/]+\/[^/]+)\/?$/) : null;
      var lessonPath = pathMatch ? pathMatch[1] : '';
      if (hasHidden && lessonPath && window.AIFSHidden.isHidden(lessonPath)) continue;
      visibleLessons++;
      var userComplete = hasProgress && lessonPath && window.AIFSProgress.isLessonComplete(lessonPath);
      if (userComplete) userDone++;

      var canOpen = (l.status === 'complete' || userComplete) && lessonPath;
      var lessonUrl = canOpen ? 'lesson?path=' + encodeURIComponent(lessonPath) : '';
      var lessonLabel = escapeHtml(l.name);
      var lessonMeta = '<span class="modal-lesson-meta"><span class="modal-lesson-type" data-type="' + escapeHtml(l.type) + '"' + (l.combines ? ' title="Combines: ' + escapeHtml(l.combines) + '"' : '') + '>' + escapeHtml(l.type) + '</span><span aria-hidden="true">·</span><span class="modal-lesson-lang">' + escapeHtml(l.lang) + '</span></span>';

      html += '<div class="modal-lesson' + (userComplete ? ' user-done' : '') + '">';
      if (canOpen) {
        html += '<a href="' + lessonUrl + '" class="modal-lesson-open" aria-label="Open lesson: ' + lessonLabel + '">';
        html += '<span class="modal-lesson-copy"><span class="modal-lesson-name">' + lessonLabel + '</span>' + lessonMeta + '</span>';
        html += '<span class="modal-lesson-cta">' + (userComplete ? 'Review' : 'Open lesson') + '<span aria-hidden="true">→</span></span></a>';
      } else {
        html += '<span class="modal-lesson-open is-unavailable" aria-disabled="true">';
        html += '<span class="modal-lesson-copy"><span class="modal-lesson-name">' + lessonLabel + '</span>' + lessonMeta + '</span>';
        html += '<span class="modal-lesson-cta">Coming soon</span></span>';
      }

      var toggleHtml = '';
      if (hasProgress && canOpen) {
        toggleHtml = '<button type="button" class="modal-lesson-toggle' + (userComplete ? ' done' : '') + '" data-path="' + lessonPath + '" title="' + (userComplete ? 'Mark as not done' : 'Mark complete') + '" aria-label="' + (userComplete ? 'Mark as not done' : 'Mark complete') + '"><span class="modal-lesson-check" aria-hidden="true">' + (userComplete ? '✓' : '') + '</span><span class="modal-lesson-toggle-label">' + (userComplete ? 'Done' : 'Mark done') + '</span></button>';
      }
      html += toggleHtml;
      var hideBtn = '';
      if (window.AIFSHidden) {
        hideBtn = '<button type="button" class="modal-lesson-hide" data-path="' + lessonPath + '" title="Remove this lesson from the course view" aria-label="Delete lesson: ' + lessonLabel + '">✕</button>';
      }
      html += hideBtn;
      html += '</div>';
    }

    if (window.AIFSHidden) {
      var hiddenHere = [];
      for (var h = 0; h < p.lessons.length; h++) {
        var hl = p.lessons[h];
        var hp = hl.url ? window.AIFSHidden.extractPath(hl.url) : null;
        if (hp && window.AIFSHidden.isLessonHidden(hp)) hiddenHere.push({ name: hl.name, path: hp });
      }
      if (hiddenHere.length > 0) {
        html += '<div class="modal-hidden-section"><span class="modal-hidden-label">Deleted in this phase (' + hiddenHere.length + ') — click to restore:</span>';
        for (var k = 0; k < hiddenHere.length; k++) {
          html += '<button type="button" class="modal-hidden-restore" data-path="' + hiddenHere[k].path + '" title="Restore this lesson">' + escapeHtml(hiddenHere[k].name) + '</button>';
        }
        html += '</div>';
      }
    }

    container.innerHTML = html;

    var toggles = container.querySelectorAll('.modal-lesson-toggle');
    for (var t = 0; t < toggles.length; t++) {
      toggles[t].addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var path = this.getAttribute('data-path');
        if (!path || !window.AIFSProgress) return;
        if (window.AIFSProgress.isLessonComplete(path)) {
          window.AIFSProgress.unmarkLessonComplete(path);
        } else {
          window.AIFSProgress.markLessonComplete(path);
        }
      });
    }

    var hideBtns = container.querySelectorAll('.modal-lesson-hide');
    for (var b = 0; b < hideBtns.length; b++) {
      hideBtns[b].addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var path = this.getAttribute('data-path');
        if (!path || !window.AIFSHidden) return;
        if (window.confirm('Delete "' + this.getAttribute('aria-label').replace(/^Delete lesson: /, '') + '" from the course view?\n\nYou can restore it later from the "Deleted in this phase" section.')) {
          window.AIFSHidden.hide(path);
        }
      });
    }

    var restoreBtns = container.querySelectorAll('.modal-hidden-restore');
    for (var r = 0; r < restoreBtns.length; r++) {
      restoreBtns[r].addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var path = this.getAttribute('data-path');
        if (!path || !window.AIFSHidden) return;
        window.AIFSHidden.restore(path);
      });
    }

    var progEl = document.getElementById('modalProgress');
    var barEl = document.getElementById('modalProgressBar');
    var barFill = document.getElementById('modalProgressBarFill');
    if (hasProgress && visibleLessons > 0) {
      var pct = Math.round((userDone / visibleLessons) * 100);
      if (progEl) {
        progEl.style.display = '';
        progEl.innerHTML = '<span><strong class="modal-progress-count">' + userDone + '</strong> of ' + visibleLessons + ' lessons complete</span><span class="modal-progress-pct">' + pct + '%</span>';
      }
      if (barEl && barFill) {
        barEl.style.display = '';
        barEl.setAttribute('role', 'progressbar');
        barEl.setAttribute('aria-label', p.name + ' progress');
        barEl.setAttribute('aria-valuemin', '0');
        barEl.setAttribute('aria-valuemax', '100');
        barEl.setAttribute('aria-valuenow', String(pct));
        barFill.style.transform = 'scaleX(' + (pct / 100) + ')';
      }
    } else {
      if (progEl) progEl.style.display = 'none';
      if (barEl) barEl.style.display = 'none';
    }
  }

  if (window.AIFSProgress) {
    window.AIFSProgress.onChange(function () {
      if (currentPhaseIdx >= 0 && PHASES[currentPhaseIdx]) {
        renderModalLessons(PHASES[currentPhaseIdx]);
      }
      populateStats();
      renderPhases();
    });
  }

  if (window.AIFSHidden) {
    window.AIFSHidden.onChange(function () {
      if (currentPhaseIdx >= 0 && PHASES[currentPhaseIdx]) {
        renderModalLessons(PHASES[currentPhaseIdx]);
      }
      populateStats();
      renderPhases();
    });
  }

  function closeModal(fromKeyboard) {
    var overlay = document.getElementById('modalOverlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.toggle('no-motion', !!fromKeyboard);
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modalReturnFocus && modalReturnFocus.isConnected && typeof modalReturnFocus.focus === 'function') {
      modalReturnFocus.focus();
    }
    modalReturnFocus = null;
    requestAnimationFrame(function () {
      overlay.classList.remove('no-motion');
    });
  }

  // One clipboard implementation for every copy chip on the site: debounced
  // copied-state revert, execCommand fallback when the async API is denied.
  function wireCopyButton(btn, label, getText) {
    if (!btn || !label) return;
    var revertTimer = null;
    var defaultLabel = label.textContent || 'copy';
    var defaultAriaLabel = btn.getAttribute('aria-label') || 'Copy command';
    function resetCopyState() {
      label.textContent = defaultLabel;
      btn.classList.remove('copied');
      btn.setAttribute('aria-label', defaultAriaLabel);
    }
    function scheduleReset() {
      if (revertTimer) clearTimeout(revertTimer);
      revertTimer = setTimeout(resetCopyState, 1500);
    }
    function confirmCopied() {
      label.textContent = 'copied';
      btn.classList.add('copied');
      btn.setAttribute('aria-label', 'Command copied');
      scheduleReset();
    }
    function reportCopyFailure() {
      label.textContent = 'retry';
      btn.classList.remove('copied');
      btn.setAttribute('aria-label', 'Copy failed. Try again');
      scheduleReset();
    }
    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.width = '1px';
      ta.style.height = '1px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var copied = false;
      try { copied = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      if (copied) confirmCopied();
      else reportCopyFailure();
    }
    btn.addEventListener('click', function () {
      var text = getText();
      if (!text) {
        reportCopyFailure();
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(confirmCopied).catch(function () { fallbackCopy(text); });
      } else {
        fallbackCopy(text);
      }
    });
  }

  function initCopyButton() {
    var code = document.getElementById('cloneCmd');
    if (code) {
      wireCopyButton(
        document.getElementById('copyBtn'),
        document.getElementById('copyBtnLabel'),
        function () { return code.textContent; }
      );
    }
    var installBtn = document.getElementById('installCopy');
    if (installBtn) {
      wireCopyButton(
        installBtn,
        document.getElementById('installCopyLabel'),
        function () { return installBtn.getAttribute('data-cmd'); }
      );
    }
  }

  function initMastheadFigure() {
    var figure = document.querySelector('[data-masthead-figure]');
    if (!figure) return;
    var panels = Array.prototype.slice.call(figure.querySelectorAll('.fig-panel'));
    var dots = Array.prototype.slice.call(figure.querySelectorAll('.fig-dot'));
    var previous = figure.querySelector('.fig-previous');
    var next = figure.querySelector('.fig-next');
    var controls = figure.querySelector('.fig-controls');
    var caption = figure.querySelector('.fig-caption');
    if (panels.length < 2 || dots.length !== panels.length || !previous || !next || !controls || !caption) return;

    var autoplayDelay = 6500;
    var current = Math.max(0, panels.findIndex(function (panel) { return panel.classList.contains('is-active'); }));
    var reducedQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var desktopQuery = window.matchMedia ? window.matchMedia('(min-width: 1280px) and (hover: hover) and (pointer: fine)') : null;
    var inViewport = !window.IntersectionObserver;
    var timer = 0;
    var timerStartedAt = 0;
    var timerRemaining = autoplayDelay;
    var autoplayCancelled = !!(reducedQuery && reducedQuery.matches);
    var autoplayComplete = false;
    var disposed = false;
    var cleanups = [];

    function now() {
      return window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now();
    }

    function listen(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      cleanups.push(function () { target.removeEventListener(type, handler, options); });
    }

    function listenToQuery(query, handler) {
      if (!query) return;
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', handler);
        cleanups.push(function () { query.removeEventListener('change', handler); });
      } else if (typeof query.addListener === 'function') {
        query.addListener(handler);
        cleanups.push(function () { query.removeListener(handler); });
      }
    }

    function isDesktopView() {
      return desktopQuery ? desktopQuery.matches : figure.getClientRects().length > 0;
    }

    function isReduced() {
      return !!(reducedQuery && reducedQuery.matches);
    }

    function isOnScreen() {
      var rect = figure.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    }

    function showPlate(index, announce) {
      current = Math.max(0, Math.min(panels.length - 1, index));
      panels.forEach(function (panel, panelIndex) {
        var active = panelIndex === current;
        panel.classList.toggle('is-active', active);
        panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      dots.forEach(function (dot, dotIndex) {
        var active = dotIndex === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      caption.setAttribute('aria-live', announce ? 'polite' : 'off');
      caption.textContent = 'Plate ' + (current + 1) + ' of ' + panels.length + '. ' + panels[current].getAttribute('data-caption');
      previous.disabled = current === 0;
      next.disabled = current === panels.length - 1;
    }

    function clearTimer(preserveRemaining) {
      if (!timer) return;
      if (preserveRemaining) {
        timerRemaining = Math.max(0, timerRemaining - (now() - timerStartedAt));
      }
      window.clearTimeout(timer);
      timer = 0;
      timerStartedAt = 0;
    }

    function canAutoplay() {
      return !autoplayCancelled && !autoplayComplete && !isReduced() && isDesktopView() && inViewport && !document.hidden && figure.getClientRects().length > 0;
    }

    function scheduleAutoplay() {
      if (timer || !canAutoplay()) return;
      if (current >= panels.length - 1) {
        autoplayComplete = true;
        figure.removeAttribute('data-autoplay');
        return;
      }
      figure.setAttribute('data-autoplay', 'true');
      timerStartedAt = now();
      timer = window.setTimeout(function () {
        timer = 0;
        timerStartedAt = 0;
        showPlate(current + 1, false);
        timerRemaining = autoplayDelay;
        if (current >= panels.length - 1) {
          autoplayComplete = true;
          figure.removeAttribute('data-autoplay');
          return;
        }
        scheduleAutoplay();
      }, Math.max(16, timerRemaining));
    }

    function cancelAutoplay() {
      clearTimer(false);
      autoplayCancelled = true;
      figure.removeAttribute('data-autoplay');
    }

    function syncRuntime() {
      if (disposed) return;
      var paused = isReduced() || !isDesktopView() || !inViewport || document.hidden || figure.getClientRects().length === 0;
      figure.setAttribute('data-motion-paused', paused ? 'true' : 'false');
      if (paused) clearTimer(true);
      else scheduleAutoplay();
    }

    function choosePlate(index) {
      cancelAutoplay();
      showPlate(index, true);
      syncRuntime();
    }

    dots.forEach(function (dot, index) {
      listen(dot, 'click', function () { choosePlate(index); });
    });
    listen(previous, 'click', function () { choosePlate(current - 1); });
    listen(next, 'click', function () { choosePlate(current + 1); });
    listen(controls, 'pointerdown', cancelAutoplay);
    listen(controls, 'keydown', cancelAutoplay);
    listen(controls, 'focusin', cancelAutoplay);
    listen(document, 'visibilitychange', syncRuntime);

    listenToQuery(reducedQuery, function () {
      if (isReduced()) cancelAutoplay();
      syncRuntime();
    });
    listenToQuery(desktopQuery, function () {
      inViewport = isOnScreen();
      syncRuntime();
    });

    if (window.IntersectionObserver) {
      var observer = new IntersectionObserver(function (entries) {
        if (!entries.length) return;
        inViewport = entries[0].isIntersecting && entries[0].intersectionRatio > 0;
        syncRuntime();
      }, { threshold: 0.12 });
      observer.observe(figure);
      cleanups.push(function () { observer.disconnect(); });
    } else {
      var checkViewport = function () {
        inViewport = isOnScreen();
        syncRuntime();
      };
      listen(window, 'scroll', checkViewport, { passive: true });
      listen(window, 'resize', checkViewport);
      checkViewport();
    }

    function cleanup() {
      if (disposed) return;
      disposed = true;
      clearTimer(false);
      while (cleanups.length) cleanups.pop()();
      figure.removeAttribute('data-autoplay');
      figure.setAttribute('data-motion-paused', 'true');
    }

    listen(window, 'pagehide', function (event) {
      if (!event.persisted) cleanup();
    });
    showPlate(current, false);
    syncRuntime();
  }

  function initFadeObserver() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visibleEls = document.querySelectorAll('.reveal, .fade-in, .ascii-rule, .toc-row');
    for (var v = 0; v < visibleEls.length; v++) {
      visibleEls[v].classList.add('in-view', 'visible');
    }

    if (!window.IntersectionObserver || prefersReduced) {
      document.querySelectorAll('.stat-row-bar').forEach(function (el) {
        el.classList.add('in-view', 'visible');
        var target = el.getAttribute('data-target-pct');
        if (target !== null) setBarScale(el, target);
      });
      return;
    }

    var els = document.querySelectorAll('.stat-row-bar');
    if (!els.length) return;
    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          var el = entries[i].target;
          el.classList.add('in-view', 'visible');
          var target = el.getAttribute('data-target-pct');
          if (target !== null) {
            setBarScale(el, target);
          }
          observer.unobserve(el);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    for (var i = 0; i < els.length; i++) {
      observer.observe(els[i]);
    }
  }

  function initStaggerIndex() {
    var rows = document.querySelectorAll('.toc-list .toc-row');
    for (var i = 0; i < rows.length; i++) {
      rows[i].style.setProperty('--stagger-delay', (i * 30) + 'ms');
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }
})();
