/* =========================================================================
   Java Before DSA — script.js
   Vanilla JS only. No frameworks, no build step.
   Sections:
     1. Storage keys & helpers
     2. Theme (dark/light)
     3. Mobile sidebar
     4. Search
     5. Topic progress (checkboxes, hero stats, sidebar dots, roadmap fill)
     6. Readiness checklist
     7. Expand / collapse all
     8. Sidebar active-link highlighting (scrollspy)
     9. Back-to-top + smooth scroll + keyboard shortcuts
     10. Init
   ========================================================================= */

(function () {
  'use strict';

  /* ---------------- 1. Storage keys & helpers --------------------------- */
  const LS_THEME = 'jbd-theme';
  const LS_PROGRESS = 'jbd-progress';     // { topicId: true }
  const LS_CHECKLIST = 'jbd-checklist';   // { questionId: true }

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('Could not read', key, e);
      return fallback;
    }
  };
  const writeJSON = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Could not save', key, e);
    }
  };

  /* ---------------- 1b. Syntax highlighter (no external library) --------- */
  const JAVA_KEYWORDS = new Set([
    'public','private','protected','static','final','void','class','new','return',
    'if','else','for','while','do','break','continue','switch','case','default',
    'this','super','extends','implements','import','package','try','catch','finally',
    'throw','throws','instanceof','interface','enum','abstract','synchronized',
    'volatile','transient','null','true','false'
  ]);
  const JAVA_TYPES = new Set([
    'int','long','double','float','char','boolean','byte','short',
    'String','Integer','Long','Double','Character','Boolean','Object',
    'Node','ArrayList','HashMap','HashSet','LinkedHashSet','Deque','ArrayDeque',
    'Queue','PriorityQueue','StringBuilder','List','Map','Set','Collections',
    'Arrays','Scanner','BufferedReader','InputStreamReader','IOException',
    'System','Math','Point','MathUtils','Animal','Dog'
  ]);

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightJava(code) {
    const master = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(\b\d[\d_]*\.?\d*[fFdDlL]?\b)|(\b[A-Za-z_]\w*\b)/g;
    let out = '';
    let lastIndex = 0;
    let m;
    while ((m = master.exec(code)) !== null) {
      out += escapeHtml(code.slice(lastIndex, m.index));
      const full = m[0];
      const [, comment, blockComment, str, chr, num, word] = m;
      if (comment || blockComment) {
        out += `<span class="tok-com">${escapeHtml(full)}</span>`;
      } else if (str || chr) {
        out += `<span class="tok-str">${escapeHtml(full)}</span>`;
      } else if (num) {
        out += `<span class="tok-num">${escapeHtml(full)}</span>`;
      } else if (word) {
        if (JAVA_KEYWORDS.has(word)) {
          out += `<span class="tok-kw">${escapeHtml(full)}</span>`;
        } else if (JAVA_TYPES.has(word)) {
          out += `<span class="tok-type">${escapeHtml(full)}</span>`;
        } else {
          const isMethodCall = /^\s*\(/.test(code.slice(master.lastIndex));
          out += isMethodCall
            ? `<span class="tok-met">${escapeHtml(full)}</span>`
            : escapeHtml(full);
        }
      }
      lastIndex = master.lastIndex;
    }
    out += escapeHtml(code.slice(lastIndex));
    return out;
  }

  function initSyntaxHighlight() {
    document.querySelectorAll('.code-block code').forEach((block) => {
      block.innerHTML = highlightJava(block.textContent);
    });
  }

  /* ---------------- 2. Theme --------------------------------------------- */
  function initTheme() {
    const saved = localStorage.getItem(LS_THEME);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = saved || (prefersLight ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);

    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(LS_THEME, next);
    });
  }

  /* ---------------- 3. Mobile sidebar ------------------------------------ */
  function initMobileNav() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const scrim = document.getElementById('mobile-scrim');
    if (!menuToggle || !sidebar || !scrim) return;

    const close = () => {
      sidebar.classList.remove('open');
      scrim.classList.remove('show');
      menuToggle.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
      sidebar.classList.add('open');
      scrim.classList.add('show');
      menuToggle.setAttribute('aria-expanded', 'true');
    };
    menuToggle.addEventListener('click', () => {
      sidebar.classList.contains('open') ? close() : open();
    });
    scrim.addEventListener('click', close);
    sidebar.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  /* ---------------- 4. Search --------------------------------------------- */
  function initSearch() {
    const input = document.getElementById('search-input');
    const countEl = document.getElementById('search-results-count');
    if (!input) return;

    // Every searchable unit: topic cards + mistake cards.
    const cards = Array.from(document.querySelectorAll('[data-searchable]'));
    const sections = Array.from(document.querySelectorAll('.topic-section'));

    function clearHighlights(el) {
      el.querySelectorAll('mark').forEach((m) => {
        const text = document.createTextNode(m.textContent);
        m.replaceWith(text);
      });
    }

    function highlight(el, term) {
      if (!term) return;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue.toLowerCase().includes(term)) return NodeFilter.FILTER_REJECT;
          if (node.parentElement.closest('.code-block')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const targets = [];
      let n;
      while ((n = walker.nextNode())) targets.push(n);
      targets.forEach((node) => {
        const idx = node.nodeValue.toLowerCase().indexOf(term);
        if (idx === -1) return;
        const before = node.nodeValue.slice(0, idx);
        const match = node.nodeValue.slice(idx, idx + term.length);
        const after = node.nodeValue.slice(idx + term.length);
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(before));
        const mark = document.createElement('mark');
        mark.textContent = match;
        frag.appendChild(mark);
        frag.appendChild(document.createTextNode(after));
        node.parentNode.replaceChild(frag, node);
      });
    }

    function runSearch() {
      const term = input.value.trim().toLowerCase();
      let visibleCount = 0;

      cards.forEach((card) => {
        clearHighlights(card);
        const haystack = (card.getAttribute('data-search-text') || card.textContent).toLowerCase();
        const matches = !term || haystack.includes(term);
        card.classList.toggle('is-search-hidden', !matches);
        if (matches) {
          visibleCount++;
          if (term) highlight(card, term);
          // auto-expand matching <details> so the hit is visible
          if (term && card.tagName === 'DETAILS') card.open = true;
        }
      });

      // hide whole sections that have zero visible cards (only for sections that contain cards)
      sections.forEach((sec) => {
        const searchableInSection = sec.querySelectorAll('[data-searchable]');
        if (!searchableInSection.length) return;
        const anyVisible = Array.from(searchableInSection).some((c) => !c.classList.contains('is-search-hidden'));
        sec.classList.toggle('is-search-hidden', term.length > 0 && !anyVisible);
      });

      if (countEl) {
        countEl.textContent = term ? `${visibleCount} match${visibleCount === 1 ? '' : 'es'}` : '';
      }

      const noResults = document.getElementById('no-results');
      if (noResults) noResults.classList.toggle('show', term.length > 0 && visibleCount === 0);
    }

    input.addEventListener('input', runSearch);

    // keyboard shortcuts: "/" focuses search, Escape clears it
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement && document.activeElement.tagName;
      const typing = activeTag === 'INPUT' || activeTag === 'TEXTAREA';
      if (e.key === '/' && !typing) {
        e.preventDefault();
        input.focus();
      } else if (e.key === 'Escape' && document.activeElement === input) {
        input.value = '';
        runSearch();
        input.blur();
      }
    });
  }

  /* ---------------- 5. Topic progress ------------------------------------- */
  function initProgress() {
    const checks = Array.from(document.querySelectorAll('.topic-check'));
    if (!checks.length) return;

    const progress = readJSON(LS_PROGRESS, {});

    // apply saved state
    checks.forEach((cb) => {
      const id = cb.dataset.topicId;
      if (progress[id]) {
        cb.checked = true;
        cb.closest('.topic-card').classList.add('is-complete');
      }
      // prevent the click from toggling the parent <details>
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', () => {
        progress[cb.dataset.topicId] = cb.checked;
        writeJSON(LS_PROGRESS, progress);
        cb.closest('.topic-card').classList.toggle('is-complete', cb.checked);
        renderProgress();
      });
    });

    const heroCompleted = document.getElementById('stat-completed');
    const heroTotal = document.getElementById('stat-total');
    const heroFill = document.getElementById('hero-progress-fill');
    const heroPct = document.getElementById('hero-progress-pct');
    const sidebarFill = document.getElementById('sidebar-progress-fill');
    const sidebarPct = document.getElementById('sidebar-progress-pct');
    const roadmapFill = document.getElementById('roadmap-fill');

    function sectionStats(sectionIds) {
      let total = 0, done = 0;
      sectionIds.forEach((id) => {
        const sec = document.getElementById(id);
        if (!sec) return;
        const boxes = sec.querySelectorAll('.topic-check');
        total += boxes.length;
        boxes.forEach((b) => { if (b.checked) done++; });
      });
      return { total, done };
    }

    function renderProgress() {
      const total = checks.length;
      const done = checks.filter((c) => c.checked).length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      if (heroCompleted) heroCompleted.textContent = done;
      if (heroTotal) heroTotal.textContent = total;
      if (heroFill) heroFill.style.width = pct + '%';
      if (heroPct) heroPct.textContent = pct + '%';
      if (sidebarFill) sidebarFill.style.width = pct + '%';
      if (sidebarPct) sidebarPct.textContent = pct + '%';
      if (roadmapFill) roadmapFill.style.height = pct + '%';

      // sidebar dots: mark done when every topic in that section is checked
      document.querySelectorAll('.side-link[data-section]').forEach((link) => {
        const id = link.getAttribute('data-section');
        const sec = document.getElementById(id);
        if (!sec) return;
        const boxes = sec.querySelectorAll('.topic-check');
        const allDone = boxes.length > 0 && Array.from(boxes).every((b) => b.checked);
        const dot = link.querySelector('.side-dot');
        if (dot) dot.classList.toggle('done', allDone);
      });

      // roadmap step states
      document.querySelectorAll('.roadmap-step[data-sections]').forEach((step) => {
        const ids = step.getAttribute('data-sections').split(',');
        const { total: t, done: d } = sectionStats(ids);
        step.classList.toggle('done', t > 0 && d === t);
        step.classList.toggle('partial', d > 0 && d < t);
      });
    }

    // reset button
    const resetBtn = document.getElementById('reset-progress');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const ok = window.confirm('Reset all topic progress? This cannot be undone.');
        if (!ok) return;
        checks.forEach((cb) => {
          cb.checked = false;
          cb.closest('.topic-card').classList.remove('is-complete');
        });
        writeJSON(LS_PROGRESS, {});
        renderProgress();
      });
    }

    renderProgress();
  }

  /* ---------------- 6. Readiness checklist -------------------------------- */
  function initChecklist() {
    const boxes = Array.from(document.querySelectorAll('.check-row input[type="checkbox"]'));
    if (!boxes.length) return;

    const saved = readJSON(LS_CHECKLIST, {});
    boxes.forEach((cb) => {
      if (saved[cb.dataset.qId]) cb.checked = true;
      cb.addEventListener('change', () => {
        saved[cb.dataset.qId] = cb.checked;
        writeJSON(LS_CHECKLIST, saved);
        render();
      });
    });

    const fillCircle = document.getElementById('checklist-ring-fill');
    const pctNum = document.getElementById('checklist-pct-num');
    const banner = document.getElementById('ready-banner');
    const circumference = fillCircle ? 2 * Math.PI * fillCircle.r.baseVal.value : 0;

    function render() {
      const total = boxes.length;
      const done = boxes.filter((b) => b.checked).length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      if (pctNum) pctNum.textContent = pct + '%';
      if (fillCircle) {
        fillCircle.style.strokeDasharray = `${circumference}`;
        fillCircle.style.strokeDashoffset = `${circumference * (1 - pct / 100)}`;
      }
      if (banner) banner.classList.toggle('show', pct === 100);
    }

    render();
  }

  /* ---------------- 7. Expand / collapse all ------------------------------ */
  function initExpandCollapse() {
    document.querySelectorAll('.section-toolbar').forEach((toolbar) => {
      const section = toolbar.closest('.topic-section');
      if (!section) return;
      const expandBtn = toolbar.querySelector('[data-action="expand-all"]');
      const collapseBtn = toolbar.querySelector('[data-action="collapse-all"]');
      const details = () => section.querySelectorAll('details.topic-card');

      if (expandBtn) expandBtn.addEventListener('click', () => details().forEach((d) => (d.open = true)));
      if (collapseBtn) collapseBtn.addEventListener('click', () => details().forEach((d) => (d.open = false)));
    });
  }

  /* ---------------- 8. Scrollspy ------------------------------------------ */
  function initScrollspy() {
    const links = Array.from(document.querySelectorAll('.side-link[href^="#"]'));
    if (!links.length) return;
    const map = new Map();
    links.forEach((l) => {
      const id = l.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) map.set(el, l);
    });
    if (!map.size) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = map.get(entry.target);
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    map.forEach((_, el) => observer.observe(el));
  }

  /* ---------------- 9. Back-to-top + misc ---------------------------------- */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 640);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function initStartButton() {
    const btn = document.getElementById('start-learning');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const target = document.getElementById('roadmap');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------------- 10. Init ------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    initSyntaxHighlight();
    initTheme();
    initMobileNav();
    initSearch();
    initProgress();
    initChecklist();
    initExpandCollapse();
    initScrollspy();
    initBackToTop();
    initStartButton();
  });
})();
