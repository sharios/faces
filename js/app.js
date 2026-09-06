/* Face Builder — vanilla PWA, no build step. */
(() => {
  'use strict';

  const STORAGE_KEY = 'facebuilder.selection.v1';
  const NONE = '__none__';

  const els = {
    stage: document.getElementById('stage'),
    tabs: document.getElementById('tabs'),
    options: document.getElementById('options'),
    random: document.getElementById('btn-random'),
    reset: document.getElementById('btn-reset'),
    download: document.getElementById('btn-download'),
    install: document.getElementById('btn-install'),
    toast: document.getElementById('toast'),
  };

  let config = null;
  let selectableKeys = [];
  let activeTab = null;
  let selection = {};
  let deferredInstall = null;

  // --------------------------------------------------------------- helpers ---
  const optionsOf = (key) => config.features[key].options;

  function findOption(key, id) {
    return optionsOf(key).find((o) => o.id === id) || null;
  }

  function defaultSelection() {
    const sel = {};
    for (const key of Object.keys(config.features)) {
      const feat = config.features[key];
      if (!feat.selectable) continue;
      sel[key] = feat.options[0] ? feat.options[0].id : NONE;
    }
    return sel;
  }

  function loadSelection() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSelection();
      const saved = JSON.parse(raw);
      const sel = defaultSelection();
      for (const key of Object.keys(sel)) {
        if (saved[key] === NONE && config.features[key].allowNone) sel[key] = NONE;
        else if (findOption(key, saved[key])) sel[key] = saved[key];
      }
      return sel;
    } catch {
      return defaultSelection();
    }
  }

  function saveSelection() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch { /* ignore */ }
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { els.toast.hidden = true; }, 1800);
  }

  // ----------------------------------------------------------------- stage ---
  // A "tint" feature (e.g. hair colour) has no layer of its own — it recolours
  // another layer named by its tintTarget.
  function tintColorFor(targetKey) {
    const tk = Object.keys(config.features).find(
      (k) => config.features[k].tintTarget === targetKey);
    if (!tk) return null;
    const opt = findOption(tk, selection[tk]);
    return (opt && opt.color) || null;
  }

  function resolvedLayers() {
    // Returns [{key, box, src, scale, tint}] in draw order, skipping empty layers.
    const out = [];
    for (const key of config.layerOrder) {
      const feat = config.features[key];
      if (!feat) continue;
      let opt = null;
      if (!feat.selectable) {
        opt = feat.options[0] || null;
      } else if (selection[key] && selection[key] !== NONE) {
        opt = findOption(key, selection[key]);
      }
      if (!opt || !opt.src) continue;
      out.push({
        key,
        box: feat.box,
        src: opt.src,
        scale: opt.scale || 1,
        tint: tintColorFor(key),
      });
    }
    return out;
  }

  function applyMask(el, src) {
    const url = `url("${src}")`;
    el.style.webkitMaskImage = url;
    el.style.maskImage = url;
    el.style.webkitMaskRepeat = el.style.maskRepeat = 'no-repeat';
    el.style.webkitMaskPosition = el.style.maskPosition = 'center';
    el.style.webkitMaskSize = el.style.maskSize = 'contain';
  }

  function renderStage() {
    els.stage.replaceChildren();
    for (const layer of resolvedLayers()) {
      const el = layer.tint ? document.createElement('div') : new Image();
      el.className = 'layer';
      el.style.left = layer.box.x + '%';
      el.style.top = layer.box.y + '%';
      el.style.width = layer.box.w + '%';
      el.style.height = layer.box.h + '%';
      if (layer.scale !== 1) el.style.transform = `scale(${layer.scale})`;
      if (layer.tint) {
        applyMask(el, layer.src);
        el.style.backgroundColor = layer.tint;
      } else {
        el.alt = '';
        el.decoding = 'async';
        el.src = layer.src;
      }
      els.stage.appendChild(el);
    }
  }

  // ------------------------------------------------------------------ tabs ---
  function renderTabs() {
    els.tabs.replaceChildren();
    selectableKeys.forEach((key) => {
      const btn = document.createElement('button');
      btn.className = 'tab';
      btn.type = 'button';
      btn.role = 'tab';
      btn.textContent = config.features[key].label;
      btn.setAttribute('aria-selected', String(key === activeTab));
      btn.addEventListener('click', () => {
        activeTab = key;
        renderTabs();
        renderOptions();
      });
      els.tabs.appendChild(btn);
    });
  }

  function renderOptions() {
    els.options.replaceChildren();
    const feat = config.features[activeTab];
    const frag = document.createDocumentFragment();

    if (feat.allowNone) {
      frag.appendChild(buildOption(activeTab, {
        id: NONE, label: 'None', src: null,
      }));
    }
    feat.options.forEach((opt) => frag.appendChild(buildOption(activeTab, opt)));
    els.options.appendChild(frag);
  }

  function buildOption(key, opt) {
    const div = document.createElement('button');
    div.className = 'option';
    div.type = 'button';
    div.title = opt.label;
    div.setAttribute('aria-label', opt.label);
    if (selection[key] === opt.id || (opt.id === NONE && selection[key] === NONE)) {
      div.classList.add('selected');
    }
    if (opt.src) {
      const tint = tintColorFor(key);
      if (tint) {
        const m = document.createElement('span');
        m.className = 'swatch-mask';
        applyMask(m, opt.src);
        m.style.backgroundColor = tint;
        div.appendChild(m);
      } else {
        const img = new Image();
        img.src = opt.src;
        img.alt = opt.label;
        img.loading = 'lazy';
        div.appendChild(img);
      }
    } else if (opt.color) {
      const sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.backgroundColor = opt.color;
      div.appendChild(sw);
    } else {
      const span = document.createElement('span');
      span.className = 'none-mark';
      span.textContent = '∅ None';
      div.appendChild(span);
    }
    div.addEventListener('click', () => {
      selection[key] = opt.id;
      saveSelection();
      renderStage();
      renderOptions();
    });
    return div;
  }

  // -------------------------------------------------------------- actions ---
  function randomize() {
    selectableKeys.forEach((key) => {
      const feat = config.features[key];
      const pool = feat.options.slice();
      // Give "none" a small chance for hair-like optional features.
      if (feat.allowNone && Math.random() < 0.12) {
        selection[key] = NONE;
        return;
      }
      selection[key] = pool[Math.floor(Math.random() * pool.length)].id;
    });
    saveSelection();
    renderStage();
    renderOptions();
  }

  function resetAll() {
    selection = defaultSelection();
    saveSelection();
    renderStage();
    renderOptions();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load ' + src));
      img.src = src;
    });
  }

  async function download() {
    const S = config.stage.width || 1000;
    const scale = 2; // export at 2x for crispness
    const canvas = document.createElement('canvas');
    canvas.width = S * scale;
    canvas.height = S * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Match the on-screen preview: solid white face background.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, S, S);

    for (const layer of resolvedLayers()) {
      let img;
      try {
        img = await loadImage(layer.src);
      } catch (e) {
        console.warn(e);
        continue;
      }
      const bx = (layer.box.x / 100) * S;
      const by = (layer.box.y / 100) * S;
      const bw = (layer.box.w / 100) * S;
      const bh = (layer.box.h / 100) * S;
      const nw = img.naturalWidth || bw;
      const nh = img.naturalHeight || bh;
      const k = Math.min(bw / nw, bh / nh) * (layer.scale || 1);
      const dw = nw * k;
      const dh = nh * k;
      const dx = bx + (bw - dw) / 2;
      const dy = by + (bh - dh) / 2;

      if (layer.tint) {
        // Recolour the (alpha) artwork: draw it, then flood with the tint
        // colour keeping only the existing pixels (source-in).
        const off = document.createElement('canvas');
        off.width = Math.max(1, Math.ceil(dw));
        off.height = Math.max(1, Math.ceil(dh));
        const octx = off.getContext('2d');
        octx.drawImage(img, 0, 0, dw, dh);
        octx.globalCompositeOperation = 'source-in';
        octx.fillStyle = layer.tint;
        octx.fillRect(0, 0, off.width, off.height);
        ctx.drawImage(off, dx, dy);
      } else {
        ctx.drawImage(img, dx, dy, dw, dh);
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) { toast('Could not export'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'face-' + Date.now() + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Saved PNG');
    }, 'image/png');
  }

  // -------------------------------------------------------------- install ---
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    els.install.hidden = false;
  });

  els.install.addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    els.install.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    els.install.hidden = true;
    toast('Installed');
  });

  // ----------------------------------------------------------------- init ---
  async function init() {
    const res = await fetch('assets/config.json', { cache: 'no-cache' });
    config = await res.json();

    selectableKeys = Object.keys(config.features).filter((k) => config.features[k].selectable);
    activeTab = selectableKeys[0];
    selection = loadSelection();

    renderTabs();
    renderOptions();
    renderStage();

    els.random.addEventListener('click', randomize);
    els.reset.addEventListener('click', resetAll);
    els.download.addEventListener('click', download);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW failed', e));
      });
    }
  }

  init().catch((e) => {
    console.error(e);
    document.getElementById('stage').textContent = 'Failed to load. Check the console.';
  });
})();
