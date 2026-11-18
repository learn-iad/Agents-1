(function () {
  const STORAGE_KEY = 'course-structure-trainer-v2';
  const STORAGE_KEY_V1 = 'course-structure-trainer-v1';
  const MAX_XP = COURSE.modules.reduce((s, m) => s + m.xp, 0);

  const els = {
    body: document.body,
    mapCanvas: document.getElementById('mapCanvas'),
    modules: document.getElementById('modules'),
    routeSvg: document.getElementById('routeSvg'),
    detailPanel: document.getElementById('detailPanel'),
    panelContent: document.getElementById('panelContent'),
    panelFormat: document.getElementById('panelFormat'),
    panelClose: document.getElementById('panelClose'),
    markVisited: document.getElementById('markVisited'),
    siteChrome: document.getElementById('siteChrome'),
    xpValue: document.getElementById('xpValue'),
    stepNow: document.getElementById('stepNow'),
    levelName: document.getElementById('levelName'),
    bannerHereTitle: document.getElementById('bannerHereTitle'),
    bannerHereFormat: document.getElementById('bannerHereFormat'),
    bannerDoneTitle: document.getElementById('bannerDoneTitle'),
    toast: document.getElementById('toast'),
    achievementModal: document.getElementById('achievementModal'),
    dismissAchievement: document.getElementById('dismissAchievement'),
    particles: document.getElementById('particles'),
    brandBadge: document.querySelector('.brand-badge'),
  };

  let state = loadState();
  let selectedId = state.lastSelected || state.hereId;
  let toastTimer = null;
  let particlesOn = false;

  function loadState() {
    const base = {
      visited: [...STORY_DEFAULTS.completedIds],
      hereId: STORY_DEFAULTS.hereId,
      lastSelected: STORY_DEFAULTS.hereId,
      view: 'path',
      achievementShown: false,
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        return {
          ...base,
          ...s,
          visited: s.visited?.length ? s.visited : base.visited,
          hereId: s.hereId ?? base.hereId,
        };
      }
    } catch (_) {}
    try {
      const v1 = localStorage.getItem(STORAGE_KEY_V1);
      if (v1) {
        const s = JSON.parse(v1);
        return {
          ...base,
          visited: s.visited?.length ? s.visited : base.visited,
          hereId: s.hereId ?? base.hereId,
          lastSelected: s.lastSelected ?? base.hereId,
          achievementShown: !!s.achievementShown,
          view: 'path',
        };
      }
    } catch (_) {}
    return base;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function moduleById(id) {
    return COURSE.modules.find((m) => m.id === id);
  }

  function isDone(id) {
    return state.visited.includes(id);
  }

  function isHere(id) {
    return state.hereId === id;
  }

  function nodeState(id) {
    if (isHere(id)) return 'here';
    if (isDone(id)) return 'done';
    if (id === state.hereId + 1) return 'next';
    return 'ahead';
  }

  function getLevel(xp) {
    let name = LEVELS[0].name;
    for (const l of LEVELS) {
      if (xp >= l.minXp) name = l.name;
    }
    return name;
  }

  function shortTitle(title) {
    return title.length > 42 ? `${title.slice(0, 40)}…` : title;
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    els.toast.setAttribute('aria-hidden', 'false');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('show');
      els.toast.setAttribute('aria-hidden', 'true');
    }, 2800);
  }

  function updateHud() {
    const visitedXp = COURSE.modules.filter((m) => isDone(m.id)).reduce((s, m) => s + m.xp, 0);
    if (els.xpValue) els.xpValue.textContent = visitedXp;
    if (els.stepNow) els.stepNow.textContent = state.hereId;
    if (els.levelName) els.levelName.textContent = getLevel(visitedXp);
    if (els.brandBadge) els.brandBadge.textContent = `Шаг ${state.hereId}`;
    saveState();
  }

  function updateBanner() {
    const here = moduleById(state.hereId);
    const lastDoneId = [...state.visited].sort((a, b) => a - b).filter((id) => id < state.hereId).pop();
    const done = lastDoneId ? moduleById(lastDoneId) : moduleById(1);

    if (here && els.bannerHereTitle) {
      const meta = FORMAT_META[here.format];
      const time = here.minutes != null ? `${here.minutes} мин` : 'по ритму';
      els.bannerHereTitle.textContent = here.title;
      if (els.bannerHereFormat) els.bannerHereFormat.textContent = `${meta.label} · ${time}`;
    }
    if (done && els.bannerDoneTitle) {
      els.bannerDoneTitle.textContent = done.title;
    }
  }

  function syncPanelLayout() {
    const root = document.documentElement;
    const gap = 12;

    if (els.siteChrome) {
      const chromeH = els.siteChrome.getBoundingClientRect().height;
      root.style.setProperty('--panel-offset-top', `${Math.ceil(chromeH + gap)}px`);
    }

    const isMobile = window.matchMedia('(max-width: 959px)').matches;
    const panelOpen = els.detailPanel && !els.detailPanel.hidden;

    if (isMobile && panelOpen) {
      const panelH = els.detailPanel.getBoundingClientRect().height;
      root.style.setProperty('--panel-bottom-reserve', `${Math.ceil(panelH)}px`);
      els.body.classList.add('panel-open');
    } else {
      root.style.setProperty('--panel-bottom-reserve', '0px');
      els.body.classList.remove('panel-open');
    }
  }

  function renderMap() {
    els.modules.innerHTML = '';
    els.modules.hidden = true;
    els.routeSvg.hidden = true;
    renderPath();
  }

  function bindNode(el, id) {
    el.dataset.id = String(id);
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    const activate = () => selectModule(id);
    el.addEventListener('click', activate);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  }

  function renderPath() {
    const { topPad, headerH, headExtra, rowH, chapterPadY, chapterPadBottom, chapterMargin } = PATH_LAYOUT;
    const headBlock = headerH + headExtra;
    let sectionsHtml = '';
    let y = topPad + chapterPadY;
    let globalIdx = 0;

    COURSE.chapters.forEach((ch) => {
      const theme = CHAPTER_THEME[ch.id];
      const mods = COURSE.modules.filter((m) => m.chapter === ch.id);
      y += headBlock;

      let rowsHtml = '';
      mods.forEach((mod) => {
        const st = nodeState(mod.id);
        const meta = FORMAT_META[mod.format];
        const side = globalIdx % 2 === 0 ? 'left' : 'right';
        const milestone = mod.id === 1 || mod.id === 2;
        const herePin = isHere(mod.id) ? '<span class="node-pin">Вы здесь</span>' : '';
        const doneMark = isDone(mod.id) ? '<span class="node-done" aria-hidden="true">✓</span>' : '';
        const statusBadge = isDone(mod.id)
          ? '<span class="node-status node-status--done">Пройдено</span>'
          : isHere(mod.id)
            ? '<span class="node-status node-status--here">Текущий шаг</span>'
            : '';
        const stepClass = isDone(mod.id) ? 'is-completed-step' : isHere(mod.id) ? 'is-current-step' : '';

        rowsHtml += `
          <div class="path-row side-${side}" data-step="${mod.id}">
            <span class="path-spine-dot state-${st} ${milestone ? 'step-milestone' : ''}" data-step="${mod.id}" aria-hidden="true"></span>
            <button type="button" class="path-node state-${st} ${milestone ? 'step-milestone' : ''} ${stepClass} ${selectedId === mod.id ? 'is-selected' : ''}"
              data-id="${mod.id}" aria-current="${isHere(mod.id) ? 'step' : 'false'}">
              <span class="node-dot" style="--accent:${meta.color}"></span>
              <span class="node-body">
                <span class="node-head">
                  <span class="node-num">${mod.id}</span>
                  ${doneMark}
                  ${herePin}
                  ${statusBadge}
                  <span class="node-format">${meta.label}</span>
                </span>
                <span class="node-title">${escapeHtml(mod.title)}</span>
              </span>
            </button>
          </div>`;
        y += rowH;
        globalIdx += 1;
      });

      y += chapterPadBottom + chapterMargin + chapterPadY;

      sectionsHtml += `
        <section class="path-chapter chapter-${ch.id}" style="--ch-tint:${theme.tint};--ch-border:${theme.border};--ch-glow:${theme.glow}">
          <header class="path-chapter-head">
            <h3 class="path-chapter-title">${escapeHtml(ch.title)}</h3>
            <p class="path-chapter-sub">${escapeHtml(ch.subtitle)}</p>
          </header>
          <div class="path-chapter-rows">${rowsHtml}</div>
        </section>`;
    });

    els.mapCanvas.innerHTML = `
      <div class="path-stage" style="--row-h:${rowH}px;--header-h:${headerH}px">
        <div class="path-lanes">
          <div class="path-future-rail" aria-hidden="true"></div>
          <div class="path-sections">${sectionsHtml}</div>
        </div>
      </div>`;

    els.mapCanvas.querySelectorAll('.path-node').forEach((el) => bindNode(el, Number(el.dataset.id)));

    requestAnimationFrame(() => syncPathRails());
  }

  function syncPathRails() {
    const lanes = els.mapCanvas.querySelector('.path-lanes');
    if (!lanes) return;

    const dot2 = lanes.querySelector('.path-spine-dot[data-step="2"]');
    const dotLast = lanes.querySelector('.path-spine-dot[data-step="18"]');
    const future = lanes.querySelector('.path-future-rail');
    const dot1 = lanes.querySelector('.path-spine-dot[data-step="1"]');

    if (dot1 && dot2) {
      const lr = lanes.getBoundingClientRect();
      const r1 = dot1.getBoundingClientRect();
      const r2 = dot2.getBoundingClientRect();
      const linkTop = r1.top - lr.top + r1.height / 2;
      const linkH = r2.top - lr.top + r2.height / 2 - linkTop;
      lanes.style.setProperty('--link-12-top', `${linkTop}px`);
      lanes.style.setProperty('--link-12-h', `${Math.max(0, linkH)}px`);
    }

    if (!future || !dot2 || !dotLast) return;
    const lr = lanes.getBoundingClientRect();
    const r2 = dot2.getBoundingClientRect();
    const rL = dotLast.getBoundingClientRect();
    const top = r2.top - lr.top + r2.height / 2;
    const height = rL.top - lr.top + rL.height / 2 - top;
    future.style.top = `${top}px`;
    future.style.height = `${Math.max(0, height)}px`;
  }

  function renderMetro() {
    const W = 900;
    const rowH = 56;
    const tracks = COURSE.chapters.length;
    const h = tracks * rowH + 120;

    let svgLines = '';
    let stations = '';

    COURSE.chapters.forEach((ch, ti) => {
      const mods = COURSE.modules.filter((m) => m.chapter === ch.id);
      if (!mods.length) return;
      const y = 60 + ti * rowH;
      const x0 = 80;
      const x1 = W - 80;
      const dx = (x1 - x0) / Math.max(mods.length - 1, 1);

      svgLines += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="metro-track"/>`;

      let progressX = x0;
      mods.forEach((mod, mi) => {
        const x = mods.length === 1 ? (x0 + x1) / 2 : x0 + mi * dx;
        const st = nodeState(mod.id);
        if (isDone(mod.id) || isHere(mod.id)) progressX = x;
        const r = 9;
        const cls = `metro-station state-${st}${selectedId === mod.id ? ' is-selected' : ''}`;
        stations += `
          <g class="${cls}" data-id="${mod.id}" role="button" tabindex="0">
            <circle cx="${x}" cy="${y}" r="${r}" class="station-ring"/>
            <text x="${x}" y="${y + 28}" text-anchor="middle" class="metro-label">${mod.id}</text>
            ${st === 'here' ? `<text x="${x}" y="${y - 18}" text-anchor="middle" class="metro-here">вы здесь</text>` : ''}
          </g>`;
      });

      const hereMod = mods.find((m) => isHere(m.id));
      const lastDone = [...mods].reverse().find((m) => isDone(m.id));
      const fromX = x0;
      const toX = hereMod
        ? mods.length === 1
          ? (x0 + x1) / 2
          : x0 + mods.findIndex((m) => m.id === hereMod.id) * dx
        : lastDone
          ? x0 + mods.findIndex((m) => m.id === lastDone.id) * dx
          : x0;
      if (toX > fromX) {
        svgLines += `<line x1="${fromX}" y1="${y}" x2="${toX}" y2="${y}" class="metro-progress"/>`;
      }

      svgLines += `<text x="24" y="${y + 5}" class="metro-chapter">${escapeHtml(ch.title)}</text>`;
    });

    els.mapCanvas.innerHTML = `
      <div class="metro-stage">
        <svg class="metro-svg" viewBox="0 0 ${W} ${h}" role="img" aria-label="Схема маршрута курса">
          ${svgLines}
          ${stations}
        </svg>
      </div>`;

    els.mapCanvas.querySelectorAll('.metro-station').forEach((g) => {
      const id = Number(g.dataset.id);
      bindNode(g, id);
    });
  }

  function renderRibbon() {
    const segments = COURSE.modules
      .map((mod) => {
        const st = nodeState(mod.id);
        const meta = FORMAT_META[mod.format];
        const showTitle = st === 'here' || st === 'done';
        return `
          <button type="button" class="ribbon-node state-${st} ${selectedId === mod.id ? 'is-selected' : ''}"
            data-id="${mod.id}" aria-current="${isHere(mod.id) ? 'step' : 'false'}">
            <span class="ribbon-dot" style="--accent:${meta.color}"></span>
            <span class="ribbon-num">${mod.id}</span>
            ${showTitle ? `<span class="ribbon-title">${escapeHtml(shortTitle(mod.title))}</span>` : ''}
            ${isHere(mod.id) ? '<span class="ribbon-pin">здесь</span>' : ''}
          </button>`;
      })
      .join('');

    const progress = ((state.hereId - 0.5) / COURSE.modules.length) * 100;

    els.mapCanvas.innerHTML = `
      <div class="ribbon-stage">
        <div class="ribbon-track">
          <div class="ribbon-fill" style="width:${progress}%"></div>
        </div>
        <div class="ribbon-scroll" id="ribbonScroll">${segments}</div>
      </div>`;

    els.mapCanvas.querySelectorAll('.ribbon-node').forEach((el) => bindNode(el, Number(el.dataset.id)));
  }

  function renderCards() {
    let lastChapter = null;
    const frag = document.createDocumentFragment();

    COURSE.modules.forEach((mod, index) => {
      if (mod.chapter !== lastChapter) {
        lastChapter = mod.chapter;
        const ch = COURSE.chapters.find((c) => c.id === mod.chapter);
        const div = document.createElement('div');
        div.className = 'chapter-divider';
        div.dataset.chapterMarker = mod.chapter;
        div.innerHTML = `<h4>${ch.title}</h4><p>${ch.subtitle}</p>`;
        frag.appendChild(div);
      }

      const meta = FORMAT_META[mod.format];
      const card = document.createElement('article');
      card.className = 'module-card';
      card.style.setProperty('--i', index);
      card.style.setProperty('--accent', meta.color);
      if (isDone(mod.id)) card.classList.add('visited');
      if (isHere(mod.id)) card.classList.add('current-you');
      card.dataset.id = String(mod.id);

      const timeLabel = mod.minutes != null ? `${mod.minutes} мин` : '—';

      card.innerHTML = `
        <div class="module-num">${mod.id}</div>
        <div class="module-body">
          <h3>${escapeHtml(mod.title)}</h3>
          <div class="module-meta">
            <span class="tag format">${meta.label}</span>
            <span class="tag">${timeLabel}</span>
          </div>
        </div>`;

      bindNode(card, mod.id);
      frag.appendChild(card);
    });

    els.modules.innerHTML = '';
    els.modules.appendChild(frag);
    drawRouteLegacy();
  }

  function drawRouteLegacy() {
    const count = COURSE.modules.length;
    const h = count * 88 + 40;
    els.routeSvg.setAttribute('viewBox', `0 0 400 ${h}`);
    let d = 'M 200 20';
    for (let i = 0; i < count; i++) {
      const y = 20 + i * 88 + 44;
      const x = i % 2 === 0 ? 120 : 280;
      d += ` L ${x} ${y}`;
      if (i < count - 1) {
        const ny = 20 + (i + 1) * 88 + 44;
        const nx = (i + 1) % 2 === 0 ? 120 : 280;
        d += ` Q 200 ${(y + ny) / 2} ${nx} ${ny}`;
      }
    }
    els.routeSvg.innerHTML = `
      <defs>
        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3dffa8"/>
          <stop offset="100%" stop-color="#5eead4"/>
        </linearGradient>
      </defs>
      <path d="${d}"/>`;
  }

  function focusNodeInView(id, smooth = true) {
    const node =
      document.querySelector(
        `.path-node[data-id="${id}"], .ribbon-node[data-id="${id}"], .module-card[data-id="${id}"]`
      ) || els.mapCanvas.querySelector(`[data-id="${id}"]`);
    if (node) {
      node.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center', inline: 'nearest' });
    }
  }

  function selectModule(id) {
    selectedId = id;
    state.lastSelected = id;
    const mod = moduleById(id);
    if (!mod) return;

    const meta = FORMAT_META[mod.format];
    const timeLabel = mod.minutes != null ? `${mod.minutes} мин` : '—';

    els.panelContent.innerHTML = `
      <p class="panel-kicker">${isHere(id) ? 'Текущий шаг курса' : isDone(id) ? 'Пройдено' : 'Впереди на маршруте'}</p>
      <h2>${escapeHtml(mod.title)}</h2>
      <div class="panel-stats">
        <div class="stat-box"><strong>${meta.label}</strong><small>Формат</small></div>
        <div class="stat-box"><strong>${timeLabel}</strong><small>Время</small></div>
        <div class="stat-box"><strong>${mod.id}</strong><small>Шаг</small></div>
      </div>
      <p>${escapeHtml(mod.description)}</p>`;

    els.panelFormat.textContent = meta.label;
    els.panelFormat.style.color = meta.color;
    els.detailPanel.hidden = false;

    const canComplete = isHere(id) && !isDone(id);
    els.markVisited.hidden = !canComplete;
    els.markVisited.textContent = canComplete ? 'Завершить этот шаг' : isDone(id) ? 'Шаг пройден' : 'Сначала дойдите до шага';
    els.markVisited.disabled = !canComplete;

    renderMap();
    requestAnimationFrame(() => {
      syncPanelLayout();
      focusNodeInView(id, true);
    });
    saveState();
  }

  function completeHereStep() {
    const id = state.hereId;
    if (isDone(id)) {
      showToast('Шаг уже завершён');
      return;
    }
    state.visited.push(id);
    state.visited.sort((a, b) => a - b);
    const mod = moduleById(id);
    const next = COURSE.modules.find((m) => m.id === id + 1);
    if (next) state.hereId = next.id;
    updateHud();
    updateBanner();
    renderMap();
    selectModule(state.hereId);
    showToast(next ? `Шаг «${mod.title}» закрыт → далее: ${shortTitle(next.title)}` : `Шаг «${mod.title}» закрыт`);

    if (state.visited.length === COURSE.modules.length && !state.achievementShown) {
      state.achievementShown = true;
      saveState();
      els.achievementModal.hidden = false;
    }
  }

  function initParticles() {
    if (!els.particles || !els.particles.getContext) return;
    const ctx = els.particles.getContext('2d');
    const dots = [];
    for (let i = 0; i < 20; i++) {
      dots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.2 + 0.4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        a: Math.random() * 0.2 + 0.05,
      });
    }
    function resize() {
      els.particles.width = window.innerWidth;
      els.particles.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    (function frame() {
      if (els.particles.hidden) return;
      ctx.clearRect(0, 0, els.particles.width, els.particles.height);
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = els.particles.width;
        if (d.x > els.particles.width) d.x = 0;
        if (d.y < 0) d.y = els.particles.height;
        if (d.y > els.particles.height) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(61, 255, 168, ${d.a})`;
        ctx.fill();
      }
      requestAnimationFrame(frame);
    })();
  }

  els.panelClose.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 959px)').matches) {
      els.detailPanel.hidden = true;
      syncPanelLayout();
    }
  });

  els.markVisited.addEventListener('click', completeHereStep);
  els.dismissAchievement.addEventListener('click', () => {
    els.achievementModal.hidden = true;
  });

  els.body.classList.add('view-path');
  renderMap();
  updateHud();
  updateBanner();
  selectModule(selectedId);

  requestAnimationFrame(() => {
    syncPathRails();
    syncPanelLayout();
    focusNodeInView(state.hereId, false);
  });

  window.addEventListener('resize', () => {
    syncPathRails();
    syncPanelLayout();
  });

  if (typeof ResizeObserver !== 'undefined' && els.siteChrome) {
    const ro = new ResizeObserver(() => syncPanelLayout());
    ro.observe(els.siteChrome);
    if (els.detailPanel) ro.observe(els.detailPanel);
  }
})();