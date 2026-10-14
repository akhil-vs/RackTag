(function(){
  // populate button-group selectors (levels A–N, bin slots 1–6)
  const letters = Array.from({length:14}, (_,i)=>String.fromCharCode(65+i)); // A–N
  const slots = Array.from({length:6}, (_,i)=>String(i+1)); // 1–6

  function buildButtonGroup(id, values){
    const group = document.getElementById(id);
    if(!group) return;
    values.forEach(v=>{
      const btn = document.createElement('div');
      btn.className = 'opt' + (v === group.dataset.value ? ' selected' : '');
      btn.textContent = v;
      btn.addEventListener('click', ()=>{
        group.dataset.value = v;
        group.querySelectorAll('.opt').forEach(o=>o.classList.remove('selected'));
        btn.classList.add('selected');
        refresh();
      });
      group.appendChild(btn);
    });
  }

  buildButtonGroup('bin-y', letters);
  buildButtonGroup('cartbin-y', letters);
  buildButtonGroup('cartbin-z', slots);

  const CART_BIN_COUNTS = {
    // Carts 1-14: 16 bins
    1: 16, 2: 16, 3: 16, 4: 16, 5: 16, 6: 16, 7: 16, 8: 16, 9: 16, 10: 16, 11: 16, 12: 16, 13: 16, 14: 16,
    // Carts 15-24: 24 bins
    15: 24, 16: 24, 17: 24, 18: 24, 19: 24, 20: 24, 21: 24, 22: 24, 23: 24, 24: 24,
    // Carts 25-39: 30 bins
    25: 30, 26: 30, 27: 30, 28: 30, 29: 30, 30: 30, 31: 30, 32: 30, 33: 30, 34: 30, 35: 30, 36: 30, 37: 30, 38: 30, 39: 30,
    // Cart 40: 48 bins (exception)
    40: 48,
    // Carts 41-70: 30 bins
    41: 30, 42: 30, 43: 30, 44: 30, 45: 30, 46: 30, 47: 30, 48: 30, 49: 30, 50: 30,
    51: 30, 52: 30, 53: 30, 54: 30, 55: 30, 56: 30, 57: 30, 58: 30, 59: 30, 60: 30,
    61: 30, 62: 30, 63: 30, 64: 30, 65: 30, 66: 30, 67: 30, 68: 30, 69: 30, 70: 30,
    // Carts 71-75: 20 bins (exception)
    71: 20, 72: 20, 73: 20, 74: 20, 75: 20,
    // Carts 76-94: 30 bins
    76: 30, 77: 30, 78: 30, 79: 30, 80: 30, 81: 30, 82: 30, 83: 30, 84: 30, 85: 30,
    86: 30, 87: 30, 88: 30, 89: 30, 90: 30, 91: 30, 92: 30, 93: 30, 94: 30,
    // Carts 95-104: 10 bins
    95: 10, 96: 10, 97: 10, 98: 10, 99: 10, 100: 10, 101: 10, 102: 10, 103: 10, 104: 10,
    // Carts 105-116: 16 bins
    105: 16, 106: 16, 107: 16, 108: 16, 109: 16, 110: 16, 111: 16, 112: 16, 113: 16, 114: 16, 115: 16, 116: 16
  };

  function getGridLayout(binCount){
    if(binCount === 8) return { rows: 2, cols: 4 };
    if(binCount === 10) return { rows: 5, cols: 2 };
    if(binCount === 16) return { rows: 4, cols: 4 };
    if(binCount === 18) return { rows: 3, cols: 6 };
    if(binCount === 20) return { rows: 4, cols: 5 };
    if(binCount === 24) return { rows: 4, cols: 6 };
    if(binCount === 30) return { rows: 5, cols: 6 };
    if(binCount === 48) return { rows: 8, cols: 6 };
    return { rows: 2, cols: 3 };
  }

  function cartMapBins(cartNumber){
    const binCount = CART_BIN_COUNTS[cartNumber] || 6;
    const layout = getGridLayout(binCount);
    const bins = [];
    const levels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    for(let row = 0; row < layout.rows; row++){
      const level = levels[row];
      for(let col = 0; col < layout.cols; col++){
        const slot = String(col + 1);
        bins.push({ level: level, slot: slot, label: level + '-' + slot });
      }
    }
    return bins;
  }

  function cartInVisualRange(inputId){
    const n = parseInt(document.getElementById(inputId).value, 10);
    return Number.isInteger(n) && n >= 1 && n <= 116 && CART_BIN_COUNTS[n];
  }

  function buildCartMap(id, onPick){
    const root = document.getElementById(id);
    if(!root) return;
    root._onPick = onPick;
  }

  function rebuildCartMapBins(id, cartNumber){
    const root = document.getElementById(id);
    if(!root) return;
    root.innerHTML = '';
    
    const binCount = CART_BIN_COUNTS[cartNumber] || 6;
    const layout = getGridLayout(binCount);
    
    root.style.gridTemplateColumns = 'repeat(' + layout.cols + ', minmax(0, 1fr))';
    
    const bins = cartMapBins(cartNumber);
    bins.forEach(function(bin){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cart-bin';
      btn.dataset.level = bin.level;
      btn.dataset.slot = bin.slot;
      btn.textContent = bin.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function(){ 
        if(root._onPick) root._onPick(bin); 
      });
      root.appendChild(btn);
    });
  }

  function paintCartMap(id, level, slot){
    const root = document.getElementById(id);
    if(!root) return;
    root.querySelectorAll('.cart-bin').forEach(function(btn){
      const on = btn.dataset.level === level && btn.dataset.slot === slot;
      btn.classList.toggle('selected', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function syncCartMaps(){
    const binField = document.getElementById('cartbin-map-field');
    const manual = document.getElementById('cartbin-manual');
    const cartInput = document.getElementById('cartbin-xxx');
    const cartNumber = parseInt(cartInput.value, 10);
    const showBin = cartInVisualRange('cartbin-xxx');
    
    if(binField) binField.hidden = !showBin;
    if(manual) manual.hidden = showBin;

    if(showBin && Number.isInteger(cartNumber)){
      rebuildCartMapBins('cartbin-map', cartNumber);
      
      const yEl = document.getElementById('cartbin-y');
      const zEl = document.getElementById('cartbin-z');
      let level = yEl && yEl.dataset.value ? yEl.dataset.value : 'A';
      let slot = zEl && zEl.dataset.value ? zEl.dataset.value : '1';
      
      const bins = cartMapBins(cartNumber);
      const validBin = bins.find(b => b.level === level && b.slot === slot);
      
      if(!validBin){
        selectGroupValue('cartbin-y', 'A');
        selectGroupValue('cartbin-z', '1');
        level = 'A';
        slot = '1';
        if(!syncCartMaps.pending){
          syncCartMaps.pending = true;
          queueMicrotask(function(){
            syncCartMaps.pending = false;
            refresh();
          });
        }
      }
      paintCartMap('cartbin-map', level, slot);
      
      const mapLabel = document.getElementById('cartbinMapLabel');
      if(mapLabel) mapLabel.textContent = level + '-' + slot;
    }
  }

  buildCartMap('cartbin-map', function(bin){
    selectGroupValue('cartbin-y', bin.level);
    selectGroupValue('cartbin-z', bin.slot);
    refresh();
  });

  const tabs = document.querySelectorAll('.tab, .app-nav-item');
  const panels = { bin:'panel-bin', cart:'panel-cart', cartbin:'panel-cartbin', scan:'panel-scan', qr:'panel-qr' };
  const typeLabels = { bin:'Bin', cart:'Cart', cartbin:'Cart bin', scan:'Scan', qr:'Custom' };
  let activeTab = 'qr';
  let actionAttempted = false;
  let lastIssue = 'waiting';

  const ANALYTICS_OPT_KEY = 'racktag_analytics_opt_in';
  const ANALYTICS_SESSION_KEY = 'racktag_analytics_session';
  const THEME_KEY = 'racktag_theme';
  const THEME_META_COLORS = { dark: '#121212', light: '#23262B' };

  function resolveTheme(pref){
    if(pref === 'system'){
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return pref === 'light' ? 'light' : 'dark';
  }

  function applyTheme(pref){
    const resolved = resolveTheme(pref);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-pref', pref);
    localStorage.setItem(THEME_KEY, pref);
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', THEME_META_COLORS[resolved]);
    const sel = document.getElementById('themeSelect');
    if(sel && sel.value !== pref) sel.value = pref;
    const toggle = document.getElementById('themeToggle');
    if(toggle){
      toggle.classList.toggle('is-light', resolved === 'light');
      toggle.setAttribute('aria-label', resolved === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
  }

  function initTheme(){
    const pref = localStorage.getItem(THEME_KEY) || document.documentElement.getAttribute('data-theme-pref') || 'dark';
    applyTheme(pref);
    const sel = document.getElementById('themeSelect');
    if(sel){
      sel.addEventListener('change', function(){
        applyTheme(sel.value);
        trackUsage('theme_change', { metadata: { theme: sel.value } });
      });
    }
    if(window.matchMedia){
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(){
        if((localStorage.getItem(THEME_KEY) || 'dark') === 'system') applyTheme('system');
      });
    }
  }
  initTheme();

  const DEFAULT_TEMPLATES = {
    bin: { pattern: 'P-01-A-{xxx}-{y}-{zzzz}', validation: { xxx: { min: 101, max: 113 }, zzzz: { min: 1000, max: 1999 } } },
    cart: { pattern: 'CRT-MAN1-{xxx}', validation: { xxx: { min: 1, max: 116 } } },
    cartbin: { pattern: 'CRT-MAN1-{xxx}-{y}-{z}', validation: { xxx: { min: 1, max: 116 } } }
  };

  let orgTemplates = null;
  let userContext = null;
  let usageStatus = { allowed: true, used: 0, limit: 500, plan: 'free' };

  function applyPattern(pattern, values){
    return pattern.replace(/\{(\w+)\}/g, function(_, key){ return String(values[key] ?? ''); });
  }

  function getTemplates(){
    if(!orgTemplates) return DEFAULT_TEMPLATES;
    return {
      bin: { ...DEFAULT_TEMPLATES.bin, ...orgTemplates.bin },
      cart: { ...DEFAULT_TEMPLATES.cart, ...orgTemplates.cart },
      cartbin: { ...DEFAULT_TEMPLATES.cartbin, ...orgTemplates.cartbin }
    };
  }

  async function loadOrgContext(){
    try {
      const [meRes, configRes, usageRes] = await Promise.all([
        fetch('/api/auth/me', { credentials: 'include' }),
        fetch('/api/org/config', { credentials: 'include' }),
        fetch('/api/usage/status', { credentials: 'include' })
      ]);
      if(meRes.ok) userContext = await meRes.json();
      if(configRes.ok){
        const cfg = await configRes.json();
        orgTemplates = cfg.templates;
      }
      if(usageRes.ok) usageStatus = await usageRes.json();
      applyTemplateChrome();
      updateUsageBanner();
      try { refresh(); } catch(err) { console.error('RackTag refresh failed', err); }
    } catch(e){}
  }

  function updateUsageBanner(){
    let banner = document.getElementById('usageBanner');
    if(!banner){
      banner = document.createElement('div');
      banner.id = 'usageBanner';
      const topbar = document.querySelector('.topbar');
      if(topbar && topbar.parentNode) topbar.parentNode.insertBefore(banner, topbar.nextSibling);
    }
    if(userContext && userContext.authenticated){
      banner.style.display = '';
      const u = usageStatus;
      const limitText = u.limit == null ? 'unlimited' : (u.used + '/' + u.limit);
      const orgName = userContext.org && userContext.org.name ? userContext.org.name : 'Organization';
      banner.innerHTML = 'Signed in as <strong>' + userContext.user.name + '</strong> (' + orgName + ') · Plan: ' + u.plan + ' · Labels this month: ' + limitText + ' · <a href="/admin">Admin</a>';
    } else {
      banner.style.display = 'none';
    }
    const pill = document.getElementById('proPill');
    if(pill) pill.hidden = !(usageStatus && usageStatus.plan === 'pro');
  }

  function rangeLabel(bounds){
    return bounds.min + '–' + bounds.max;
  }

  function setText(id, text){
    const el = document.getElementById(id);
    if(el) el.textContent = text;
  }

  function setBounds(id, bounds){
    const el = document.getElementById(id);
    if(!el || !bounds) return;
    el.min = String(bounds.min);
    el.max = String(bounds.max);
  }

  function applyTemplateChrome(){
    const t = getTemplates();
    setBounds('bin-xxx', t.bin.validation.xxx);
    setBounds('bin-zzzz', t.bin.validation.zzzz);
    setBounds('cart-xxx', t.cart.validation.xxx);
    setBounds('cartbin-xxx', t.cartbin.validation.xxx);
    setText('binAisleRange', rangeLabel(t.bin.validation.xxx));
    setText('binIdRange', rangeLabel(t.bin.validation.zzzz));
    setText('cartRange', rangeLabel(t.cart.validation.xxx));
    setText('cartbinRange', rangeLabel(t.cartbin.validation.xxx));
    const prefix = t.bin.pattern.split('{')[0].replace(/-+$/, '');
    setText('binZoneMeta', prefix || 'Site');
  }

  function syntaxFromPattern(pattern, values){
    const parts = [];
    const re = /\{(\w+)\}/g;
    let last = 0;
    let match;
    function pushLiteral(text){
      const trimmed = text.replace(/^-+/, '').replace(/-+$/, '');
      if(trimmed) parts.push({ text: trimmed, hot: false });
    }
    while((match = re.exec(pattern))){
      pushLiteral(pattern.slice(last, match.index));
      const raw = values[match[1]];
      parts.push({ text: raw == null || raw === '' ? '—' : String(raw), hot: true });
      last = match.index + match[0].length;
    }
    pushLiteral(pattern.slice(last));
    return parts;
  }

  async function checkUsageGate(action){
    const billable = ['download_png', 'add_to_sheet', 'print_sheet'];
    if(billable.indexOf(action) === -1) return true;
    try {
      const res = await fetch('/api/usage/check', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action })
      });
      if(res.ok) return true;
      const data = await res.json();
      alert(data.message || 'Monthly label limit reached. Visit /admin/billing to upgrade.');
      return false;
    } catch(e){
      return true;
    }
  }

  function getAnalyticsSessionId(){
    let id = localStorage.getItem(ANALYTICS_SESSION_KEY);
    if(!id){
      id = (crypto.randomUUID && crypto.randomUUID()) || (Date.now() + '-' + Math.random().toString(16).slice(2));
      localStorage.setItem(ANALYTICS_SESSION_KEY, id);
    }
    return id;
  }

  function isAnalyticsEnabled(){
    return localStorage.getItem(ANALYTICS_OPT_KEY) === '1';
  }

  function setAnalyticsEnabled(on){
    localStorage.setItem(ANALYTICS_OPT_KEY, on ? '1' : '0');
  }

  function trackUsage(eventType, details){
    if(!isAnalyticsEnabled()) return;
    const payload = {
      sessionId: getAnalyticsSessionId(),
      event: eventType,
      tab: activeTab,
      scanMode: details && details.scanMode ? details.scanMode : (typeof getScanMode === 'function' && activeTab === 'scan' ? getScanMode() : null),
      labelCode: details && details.labelCode ? details.labelCode : null,
      sheetCount: details && details.sheetCount != null ? details.sheetCount : null,
      metadata: details && details.metadata ? details.metadata : null
    };
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function(){});
  }

  function activateTab(tabKey){
    if(!tabKey || !panels[tabKey]) return;
    const nextPanel = document.getElementById(panels[tabKey]);
    if(!nextPanel) return;

    if(activeTab === 'scan' && tabKey !== 'scan'){
      try { stopCamera(); } catch(_) {}
    }

    actionAttempted = false;
    document.querySelectorAll('.tab, .app-nav-item').forEach(x=>{
      const on = x.dataset.tab === tabKey;
      x.classList.toggle('active', on);
      if(x.getAttribute('role') === 'tab') x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Object.values(panels).forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.style.display = 'none';
    });

    activeTab = tabKey;
    nextPanel.style.display = 'block';

    const typeLabel = document.getElementById('typeLabel');
    const tagEyebrow = document.getElementById('tagEyebrow');
    if(typeLabel) typeLabel.textContent = typeLabels[activeTab];
    if(tagEyebrow) tagEyebrow.textContent = typeLabels[activeTab];
    trackUsage('tab_change', { metadata: { tab: activeTab } });
    try { refresh(); } catch(err) { console.error('RackTag refresh failed', err); }
  }

  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      activateTab(t.dataset.tab);
    });
  });

  function setError(fieldId, hasError){
    document.getElementById(fieldId).classList.toggle('error', hasError);
  }

  function formatNum(n){
    const v = parseInt(n, 10);
    return Number.isFinite(v) ? String(v) : '';
  }

  function normalizeCartInput(el){
    const v = parseInt(el.value, 10);
    if(Number.isFinite(v)) el.value = String(v);
  }

  function markInvalid(touchErrors, hardInvalid){
    if(!touchErrors) return;
    lastIssue = hardInvalid || actionAttempted ? 'invalid' : 'waiting';
  }

  function computeCode(forTab){
    const tab = forTab || activeTab;
    const touchErrors = !forTab || forTab === activeTab;
    const templates = getTemplates();
    if(tab === 'bin'){
      const xxxRaw = document.getElementById('bin-xxx').value;
      const zzzzRaw = document.getElementById('bin-zzzz').value;
      const xxx = parseInt(xxxRaw, 10);
      const y = document.getElementById('bin-y').dataset.value;
      const zzzz = parseInt(zzzzRaw, 10);
      const v = templates.bin.validation;
      const xxxBlank = String(xxxRaw).trim() === '';
      const zzzzBlank = String(zzzzRaw).trim() === '';
      const xxxOk = Number.isInteger(xxx) && xxx >= v.xxx.min && xxx <= v.xxx.max;
      const zzzzOk = Number.isInteger(zzzz) && zzzz >= v.zzzz.min && zzzz <= v.zzzz.max;
      if(touchErrors){
        setError('bin-xxx-field', !xxxOk && (!xxxBlank || actionAttempted));
        setError('bin-zzzz-field', !zzzzOk && (!zzzzBlank || actionAttempted));
      }
      if(!xxxOk || !zzzzOk){
        markInvalid(touchErrors, (!xxxOk && !xxxBlank) || (!zzzzOk && !zzzzBlank), xxxBlank || zzzzBlank);
        return null;
      }
      if(touchErrors){
        lastIssue = 'ready';
        actionAttempted = false;
      }
      return applyPattern(templates.bin.pattern, { xxx: xxx, y: y, zzzz: zzzz, aisle: xxx, level: y, bin: zzzz });
    }
    if(tab === 'cart'){
      const raw = document.getElementById('cart-xxx').value;
      const xxx = parseInt(raw, 10);
      const v = templates.cart.validation;
      const blank = String(raw).trim() === '';
      const ok = Number.isInteger(xxx) && xxx >= v.xxx.min && xxx <= v.xxx.max;
      if(touchErrors) setError('cart-xxx-field', !ok && (!blank || actionAttempted));
      if(!ok){
        markInvalid(touchErrors, !ok && !blank, blank);
        return null;
      }
      if(touchErrors){
        lastIssue = 'ready';
        actionAttempted = false;
      }
      const cart = formatNum(xxx);
      return applyPattern(templates.cart.pattern, { xxx: cart, cart: cart });
    }
    if(tab === 'cartbin'){
      const raw = document.getElementById('cartbin-xxx').value;
      const xxx = parseInt(raw, 10);
      const y = document.getElementById('cartbin-y').dataset.value;
      const z = parseInt(document.getElementById('cartbin-z').dataset.value, 10);
      const v = templates.cartbin.validation;
      const blank = String(raw).trim() === '';
      const xxxOk = Number.isInteger(xxx) && xxx >= v.xxx.min && xxx <= v.xxx.max;
      if(touchErrors) setError('cartbin-xxx-field', !xxxOk && (!blank || actionAttempted));
      if(!xxxOk){
        markInvalid(touchErrors, !xxxOk && !blank, blank);
        return null;
      }
      if(touchErrors){
        lastIssue = 'ready';
        actionAttempted = false;
      }
      const cart = formatNum(xxx);
      const slot = formatNum(z);
      return applyPattern(templates.cartbin.pattern, { xxx: cart, y: y, z: slot, cart: cart, level: y, slot: slot });
    }
    if(tab === 'scan'){
      const raw = document.getElementById('scan-value').value;
      const val = raw.trim();
      const ok = val.length > 0;
      if(touchErrors) setError('scan-value-field', !ok && actionAttempted);
      if(!ok){
        markInvalid(touchErrors, false, true);
        return null;
      }
      if(touchErrors){
        lastIssue = 'ready';
        actionAttempted = false;
      }
      return val;
    }
    if(tab === 'qr'){
      const raw = document.getElementById('qr-text').value;
      const val = raw.trim();
      const ok = val.length > 0;
      if(touchErrors) setError('qr-text-field', !ok && (actionAttempted || raw.length > 0));
      if(!ok){
        markInvalid(touchErrors, raw.length > 0, raw.trim() === '');
        return null;
      }
      if(touchErrors){
        lastIssue = 'ready';
        actionAttempted = false;
      }
      return val;
    }
  }

  function stateFor(tab){
    const code = computeCode(tab);
    if(code) return 'valid';
    if(tab === activeTab && lastIssue === 'invalid') return 'invalid';
    return 'waiting';
  }

  function renderQR(container, text, size){
    container.innerHTML = '';
    new QRCode(container, {
      text: text,
      width: size,
      height: size,
      colorDark: '#1E1E1E',
      colorLight: '#FBF7E9',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function renderTicks(){
    const ticks = document.getElementById('ticks');
    ticks.innerHTML = '';
    for(let i=0;i<24;i++){
      const d = document.createElement('div');
      const h = (i % 5 === 0) ? 14 : 8;
      d.style.height = h + 'px';
      ticks.appendChild(d);
    }
  }
  renderTicks();

  const qrHolder = document.getElementById('qrHolder');
  const tagCode = document.getElementById('tagCode');
  const statusLine = document.getElementById('statusLine');

  function updateEncoderChrome(code){
    const qrText = document.getElementById('qr-text');
    const charCount = document.getElementById('charCount');
    const liveSync = document.getElementById('liveSync');
    const clearBtn = document.getElementById('clearPayloadBtn');
    if(!qrText) return;
    if(charCount) charCount.textContent = String(qrText.value.length);
    if(liveSync) liveSync.classList.toggle('on', activeTab === 'qr' && !!code);
    if(clearBtn) clearBtn.hidden = qrText.value.length === 0;
  }

  function paintStatus(text, kind){
    statusLine.textContent = text;
    statusLine.classList.toggle('ok', kind === 'ok');
    statusLine.classList.toggle('warn', kind === 'warn');
    const kicker = document.getElementById('liveCodeKicker');
    const live = document.getElementById('liveCodeValue');
    if(kicker) kicker.textContent = typeLabels[activeTab] || '';
    if(live){
      live.textContent = kind === 'ok' ? tagCode.textContent : text;
      live.classList.toggle('is-ready', kind === 'ok');
    }
  }

  function refresh(){
    const code = computeCode();
    if(code){
      renderQR(qrHolder, code, 150);
      tagCode.textContent = code;
      paintStatus('Ready to print or save', 'ok');
    } else {
      qrHolder.innerHTML = '';
      tagCode.textContent = '—';
      if(lastIssue === 'invalid') paintStatus('Fix the highlighted field to generate a label', 'warn');
      else paintStatus('Enter a value to build a label', 'idle');
    }
    updateEncoderChrome(code);
    renderBinSyntax();
    renderCartSyntax();
    renderCartBinSyntax();
    renderScanSyntax();
    return code;
  }

  function setFormatBadge(badgeId, titleId, subId, state){
    const badge = document.getElementById(badgeId);
    const title = document.getElementById(titleId);
    const sub = document.getElementById(subId);
    if(badge){
      badge.classList.toggle('is-valid', state === 'valid');
      badge.classList.toggle('is-invalid', state === 'invalid');
      badge.classList.toggle('is-waiting', state === 'waiting');
    }
    const copy = state === 'valid'
      ? ['Format valid', 'Verified']
      : state === 'invalid'
        ? ['Format invalid', 'Check fields']
        : ['Waiting', 'Enter a value'];
    if(title) title.textContent = copy[0];
    if(sub) sub.textContent = copy[1];
  }

  function appendSyntax(root, parts){
    root.replaceChildren();
    parts.forEach(function(part, i){
      if(i > 0){
        const node = document.createElement('span');
        node.className = 'sep';
        node.textContent = '-';
        root.appendChild(node);
      }
      const node = document.createElement(part.hot ? 'b' : 'span');
      node.textContent = part.text;
      root.appendChild(node);
    });
  }

  function renderBinSyntax(){
    const yEl = document.getElementById('bin-y');
    const y = yEl && yEl.dataset.value ? yEl.dataset.value : 'A';
    const tier = document.getElementById('binTierLabel');
    if(tier) tier.textContent = 'Level ' + y;
    const root = document.getElementById('binSyntax');
    if(!root) return;
    const xxx = document.getElementById('bin-xxx') ? document.getElementById('bin-xxx').value : '';
    const zzzz = document.getElementById('bin-zzzz') ? document.getElementById('bin-zzzz').value : '';
    const t = getTemplates();
    appendSyntax(root, syntaxFromPattern(t.bin.pattern, {
      xxx: xxx, y: y, zzzz: zzzz, aisle: xxx, level: y, bin: zzzz
    }));
    setFormatBadge('binFormatBadge', 'binFormatTitle', 'binFormatSub', stateFor('bin'));
  }

  function renderCartSyntax(){
    const root = document.getElementById('cartSyntax');
    if(!root) return;
    const xxxEl = document.getElementById('cart-xxx');
    const xxx = xxxEl ? xxxEl.value : '';
    const t = getTemplates();
    appendSyntax(root, syntaxFromPattern(t.cart.pattern, { xxx: xxx, cart: xxx }));
    setFormatBadge('cartFormatBadge', 'cartFormatTitle', 'cartFormatSub', stateFor('cart'));
  }

  const PACK_STATION_QR = 'MAN1-FC-PACK-1';

  const scanModeLabels = {
    barcode: 'Barcode',
    text: 'Read text',
    pack: 'Pack QR'
  };

  function renderScanSyntax(){
    const modeLabel = document.getElementById('scanModeLabel');
    if(!modeLabel) return;
    const modeEl = document.getElementById('scan-mode');
    const mode = modeEl && modeEl.dataset.value ? modeEl.dataset.value : 'barcode';
    modeLabel.textContent = scanModeLabels[mode] || 'Barcode';
  }

  function renderCartBinSyntax(){
    const xxxEl = document.getElementById('cartbin-xxx');
    const yEl = document.getElementById('cartbin-y');
    const zEl = document.getElementById('cartbin-z');
    const xxx = xxxEl ? xxxEl.value : '';
    const y = yEl && yEl.dataset.value ? yEl.dataset.value : 'A';
    const z = zEl && zEl.dataset.value ? zEl.dataset.value : '1';
    const tier = document.getElementById('cartbinTierLabel');
    const slot = document.getElementById('cartbinSlotLabel');
    if(tier) tier.textContent = 'Level ' + y;
    if(slot) slot.textContent = 'Slot ' + z;
    syncCartMaps();
    const root = document.getElementById('cartbinSyntax');
    if(!root) return;
    const t = getTemplates();
    appendSyntax(root, syntaxFromPattern(t.cartbin.pattern, {
      xxx: xxx, y: y, z: z, cart: xxx, level: y, slot: z
    }));
    setFormatBadge('cartbinFormatBadge', 'cartbinFormatTitle', 'cartbinFormatSub', stateFor('cartbin'));
  }

  ['cart-xxx', 'cartbin-xxx'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', ()=>{ normalizeCartInput(el); refresh(); });
    el.addEventListener('change', ()=>{ normalizeCartInput(el); refresh(); });
  });

  document.querySelectorAll('input, select, textarea').forEach(el=>{
    if(el.id === 'cart-xxx' || el.id === 'cartbin-xxx') return;
    el.addEventListener('input', refresh);
    el.addEventListener('change', refresh);
  });

  // ---- live camera barcode + text scanning ----
  const scanVideoWrap = document.getElementById('scan-video-wrap');
  const scanVideo = document.getElementById('scan-video');
  const scanReticle = document.getElementById('scan-reticle');
  const scanWordLayer = document.getElementById('scan-word-layer');
  const scanStatus = document.getElementById('scan-status');
  const scanValue = document.getElementById('scan-value');
  const scanStartBtn = document.getElementById('scanStartBtn');
  const scanStopBtn = document.getElementById('scanStopBtn');
  const scanCaptureBtn = document.getElementById('scanCaptureBtn');
  const scanPicker = document.getElementById('scan-picker');
  const scanPickerList = document.getElementById('scan-picker-list');
  const scanModeGroup = document.getElementById('scan-mode');
  const scanModeHint = document.getElementById('scan-mode-hint');

  let zxReader = null;
  let scanStream = null;
  let tesseractWorker = null;
  let ocrBusy = false;

  const scanModeHints = {
    barcode: 'Barcode mode — point at a barcode and hold steady. Works with UPC, EAN, Code 128, Code 39 and similar formats.',
    text: 'Read text mode — fill the frame with the text on screen, hold steady, then tap Scan words. For phone/computer screens, reduce glare and use max brightness.',
    pack: 'Shows the static pack station QR for MAN1-FC-PACK-1. Hold the screen up to scan it, or add the label to the print sheet.'
  };

  function renderPackStationQr(){
    const holder = document.getElementById('packStationQr');
    if(!holder) return;
    renderQR(holder, PACK_STATION_QR, 180);
  }

  function applyScanMode(mode){
    if(scanStream || zxReader) stopCamera();
    hideScanPicker();
    clearWordBoxes();
    scanModeGroup.dataset.value = mode;
    scanModeGroup.querySelectorAll('.opt').forEach(o=>{
      o.classList.toggle('selected', o.dataset.v === mode);
    });
    if(scanModeHint) scanModeHint.textContent = scanModeHints[mode] || scanModeHints.barcode;
    const pack = mode === 'pack';
    const cameraBlock = document.getElementById('scan-camera-block');
    const packCard = document.getElementById('pack-station-card');
    if(cameraBlock) cameraBlock.hidden = pack;
    if(packCard) packCard.hidden = !pack;
    if(scanValue){
      scanValue.readOnly = pack;
      if(pack) scanValue.value = PACK_STATION_QR;
      else if(scanValue.value.trim() === PACK_STATION_QR) scanValue.value = '';
    }
    if(pack) renderPackStationQr();
    else setScanStatus('Camera is off.');
    refresh();
  }

  scanModeGroup.querySelectorAll('.opt').forEach(opt=>{
    opt.addEventListener('click', ()=>{
      applyScanMode(opt.dataset.v);
    });
  });

  function getScanMode(){
    if(!scanModeGroup) return 'barcode';
    return scanModeGroup.dataset.value || 'barcode';
  }

  function setScanStatus(text, cls){
    scanStatus.textContent = text;
    scanStatus.className = 'scan-status' + (cls ? ' ' + cls : '');
    const meta = document.getElementById('scanCameraMeta');
    if(meta){
      if(scanStream || zxReader) meta.textContent = 'Live';
      else if(cls === 'success') meta.textContent = 'Captured';
      else if(cls === 'loading') meta.textContent = 'Scanning';
      else if(cls === 'fail') meta.textContent = 'Error';
      else meta.textContent = 'Idle';
    }
  }

  function parseScanCodes(text){
    return text.split(/\r?\n|\r/)
      .map(s=>s.trim())
      .filter(s=>s.length > 0);
  }

  function hideScanPicker(){
    scanPicker.style.display = 'none';
    scanPickerList.innerHTML = '';
  }

  function clearWordBoxes(){
    scanWordLayer.innerHTML = '';
    scanWordLayer.classList.remove('active');
  }

  function selectScanCode(code){
    scanValue.value = code;
    setScanStatus('Selected: ' + code, 'success');
    scanPickerList.querySelectorAll('.pick').forEach(btn=>{
      btn.classList.toggle('selected', btn.textContent === code);
    });
    trackUsage('scan_barcode', { labelCode: code, metadata: { source: 'picker' } });
    refresh();
  }

  function selectWord(text, boxEl){
    scanWordLayer.querySelectorAll('.scan-word-box').forEach(b=>b.classList.remove('selected'));
    if(boxEl) boxEl.classList.add('selected');
    scanValue.value = text;
    setScanStatus('Selected: ' + text, 'success');
    trackUsage('scan_text', { labelCode: text });
    refresh();
  }

  function showScanPicker(codes){
    scanPickerList.innerHTML = '';
    codes.forEach(code=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pick';
      btn.textContent = code;
      btn.addEventListener('click', ()=> selectScanCode(code));
      scanPickerList.appendChild(btn);
    });
    scanPicker.style.display = 'block';
    setScanStatus(codes.length + ' codes found — choose one below.', 'success');
  }

  function handleScanResult(text){
    const codes = parseScanCodes(text);
    if(codes.length === 0) return;
    stopCamera();
    if(codes.length === 1){
      scanValue.value = codes[0];
      hideScanPicker();
      setScanStatus('Decoded: ' + codes[0], 'success');
      trackUsage('scan_barcode', { labelCode: codes[0], metadata: { source: 'camera' } });
      refresh();
    } else {
      showScanPicker(codes);
    }
  }

  async function terminateTesseract(){
    if(tesseractWorker){
      try{ await tesseractWorker.terminate(); }catch(e){}
      tesseractWorker = null;
    }
  }

  const OCR_TARGET_MIN_WIDTH = 1600;
  const OCR_MIN_CONFIDENCE = 8;
  const OCR_FRAME_COUNT = 3;
  const OCR_FRAME_GAP_MS = 120;

  function sleep(ms){
    return new Promise(resolve=>setTimeout(resolve, ms));
  }

  async function ensureTesseractWorker(){
    if(typeof Tesseract === 'undefined'){
      throw new Error('Text reader failed to load.');
    }
    if(!tesseractWorker){
      setScanStatus('Loading text reader (first time may take a moment)…', 'loading');
      tesseractWorker = await Tesseract.createWorker('eng');
      await tesseractWorker.setParameters({
        tessedit_pageseg_mode: '11',
        preserve_interword_spaces: '1'
      });
    }
    return tesseractWorker;
  }

  function captureVideoFrame(){
    const rect = scanVideoWrap.getBoundingClientRect();
    const vw = scanVideo.videoWidth;
    const vh = scanVideo.videoHeight;
    const aspect = rect.width / rect.height;
    let width = Math.min(vw, Math.max(Math.round(rect.width * 2), OCR_TARGET_MIN_WIDTH));
    let height = Math.round(width / aspect);
    if(height > vh){
      height = vh;
      width = Math.round(height * aspect);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const scale = Math.max(width / vw, height / vh);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;
    ctx.drawImage(scanVideo, sx, sy, sw, sh, 0, 0, width, height);
    return { canvas, width, height };
  }

  function preprocessForOcr(sourceCanvas){
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const ctx = out.getContext('2d');
    ctx.filter = 'blur(0.8px)';
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.filter = 'none';

    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;
    const grays = new Float32Array(width * height);
    let min = 255;
    let max = 0;
    for(let i = 0, p = 0; i < d.length; i += 4, p++){
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      grays[p] = g;
      if(g < min) min = g;
      if(g > max) max = g;
    }
    const range = Math.max(max - min, 24);
    for(let i = 0, p = 0; i < d.length; i += 4, p++){
      let v = ((grays[p] - min) / range) * 255;
      v = v < 140 ? Math.max(0, v * 0.82) : Math.min(255, v * 1.08 + 12);
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return out;
  }

  function normalizeOcrText(text){
    return text.replace(/\s+/g, ' ').replace(/[|]/g, 'I').trim();
  }

  function extractCodeTokens(text){
    const matches = text.match(/[A-Z]{2,}[A-Z0-9-]*|[A-Z0-9]+(?:-[A-Z0-9]+){2,}|\b\d{3,}\b/gi);
    return matches ? matches.map(s=>s.trim()).filter(Boolean) : [];
  }

  function extractOcrCandidates(data){
    const out = [];
    const seen = new Set();

    function addCandidate(text, bbox, confidence){
      const cleaned = normalizeOcrText(text);
      if(!cleaned || cleaned.length < 2 || confidence < OCR_MIN_CONFIDENCE) return;
      const key = cleaned.toUpperCase();
      if(seen.has(key)) return;
      seen.add(key);
      out.push({ text: cleaned, bbox, confidence });
    }

    (data.lines || []).forEach(line=>{
      const lineText = normalizeOcrText(line.text || '');
      if(!lineText) return;
      const tokens = extractCodeTokens(lineText);
      if(tokens.length){
        tokens.forEach(token=>addCandidate(token, line.bbox, line.confidence || 0));
      } else {
        addCandidate(lineText, line.bbox, line.confidence || 0);
      }
    });

    (data.words || []).forEach(word=>{
      addCandidate(word.text || '', word.bbox, word.confidence || 0);
    });

    return out.sort((a, b)=>b.confidence - a.confidence);
  }

  function mergeOcrCandidates(allCandidates){
    const merged = new Map();
    allCandidates.forEach(item=>{
      const key = item.text.toUpperCase();
      const prev = merged.get(key);
      if(!prev || item.confidence > prev.confidence){
        merged.set(key, item);
      }
    });
    return [...merged.values()].sort((a, b)=>b.confidence - a.confidence);
  }

  function renderWordBoxes(candidates, width, height){
    clearWordBoxes();
    let count = 0;
    candidates.forEach(item=>{
      const { x0, y0, x1, y1 } = item.bbox;
      if(x1 <= x0 || y1 <= y0) return;
      const box = document.createElement('button');
      box.type = 'button';
      box.className = 'scan-word-box';
      box.textContent = item.text;
      box.style.left = (x0 / width * 100) + '%';
      box.style.top = (y0 / height * 100) + '%';
      box.style.width = ((x1 - x0) / width * 100) + '%';
      box.style.height = ((y1 - y0) / height * 100) + '%';
      box.addEventListener('click', ()=> selectWord(item.text, box));
      scanWordLayer.appendChild(box);
      count++;
    });
    if(count > 0) scanWordLayer.classList.add('active');
    return count;
  }

  async function captureAndReadText(){
    if(ocrBusy || !scanStream) return;
    if(!scanVideo.videoWidth){
      setScanStatus('Camera is still starting — try again in a moment.', 'fail');
      return;
    }
    ocrBusy = true;
    scanCaptureBtn.disabled = true;
    clearWordBoxes();
    setScanStatus('Reading text… hold the screen steady.', 'loading');
    try{
      const worker = await ensureTesseractWorker();
      const merged = [];
      let frameSize = null;
      for(let i = 0; i < OCR_FRAME_COUNT; i++){
        const { canvas, width, height } = captureVideoFrame();
        const processed = preprocessForOcr(canvas);
        const { data } = await worker.recognize(processed);
        merged.push(...extractOcrCandidates(data));
        frameSize = { width, height };
        if(i < OCR_FRAME_COUNT - 1) await sleep(OCR_FRAME_GAP_MS);
      }
      const candidates = mergeOcrCandidates(merged);
      const count = renderWordBoxes(candidates, frameSize.width, frameSize.height);
      if(count === 0){
        setScanStatus('No readable text found — move closer, reduce glare, and try again.', 'fail');
      } else {
        setScanStatus(count + ' match' + (count === 1 ? '' : 'es') + ' found — tap a box to use it.', 'success');
      }
    }catch(err){
      setScanStatus('Text scan failed — try again or type the value manually.', 'fail');
    }finally{
      ocrBusy = false;
      scanCaptureBtn.disabled = false;
    }
  }

  function stopCamera(){
    if(zxReader){
      try{ zxReader.reset(); }catch(e){}
      zxReader = null;
    }
    if(scanStream){
      scanStream.getTracks().forEach(t=>t.stop());
      scanStream = null;
    }
    scanVideo.srcObject = null;
    scanVideoWrap.style.display = 'none';
    scanReticle.style.display = '';
    scanCaptureBtn.style.display = 'none';
    scanCaptureBtn.disabled = false;
    clearWordBoxes();
    terminateTesseract();
    scanStartBtn.disabled = false;
    scanStopBtn.disabled = true;
    ocrBusy = false;
  }

  function startBarcodeCamera(){
    if(typeof ZXing === 'undefined'){
      setScanStatus('Barcode reader failed to load — type the value manually below.', 'fail');
      return;
    }
    scanReticle.style.display = '';
    scanCaptureBtn.style.display = 'none';
    setScanStatus('Starting camera…', 'loading');

    zxReader = new ZXing.BrowserMultiFormatReader();
    zxReader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      scanVideo,
      (result)=>{
        if(scanStream === null && scanVideo.srcObject){
          scanStream = scanVideo.srcObject;
        }
        if(result){
          handleScanResult(result.getText());
        }
      }
    ).then(()=>{
      if(scanVideo.srcObject) scanStream = scanVideo.srcObject;
      if(scanStatus.textContent === 'Starting camera…') setScanStatus('Scanning… hold the barcode inside the frame.', 'loading');
    }).catch(handleCameraError);
  }

  async function startTextCamera(){
    scanReticle.style.display = 'none';
    scanCaptureBtn.style.display = 'inline-block';
    setScanStatus('Starting camera…', 'loading');
    try{
      scanStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      scanVideo.srcObject = scanStream;
      await scanVideo.play();
      setScanStatus('Point at text and tap Scan words.', 'loading');
    }catch(err){
      handleCameraError(err);
    }
  }

  function handleCameraError(err){
    let msg = 'Could not access the camera. Type the value manually below.';
    const name = err && err.name;
    if(name === 'NotAllowedError' || name === 'SecurityError'){
      msg = 'Camera permission was blocked. If you\'re viewing this inside a chat preview, open the file directly in its own browser tab (not the embedded preview) — sandboxed previews can\'t request camera access. Otherwise check your browser\'s site permissions.';
    } else if(name === 'NotFoundError'){
      msg = 'No camera was found on this device. Type the value manually below.';
    } else if(name === 'NotReadableError'){
      msg = 'The camera is already in use by another app. Close it and try again, or type the value manually.';
    }
    setScanStatus(msg, 'fail');
    stopCamera();
  }

  function startCamera(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      setScanStatus('This browser/context has no camera access (often because this page is inside an embedded preview, or it isn\'t loaded over HTTPS). Open the file directly in its own tab, or type the value manually below.', 'fail');
      return;
    }
    scanStartBtn.disabled = true;
    scanStopBtn.disabled = false;
    scanVideoWrap.style.display = 'block';
    hideScanPicker();
    clearWordBoxes();

    trackUsage('camera_start', {
      metadata: { mode: getScanMode() },
      scanMode: getScanMode()
    });

    if(getScanMode() === 'text'){
      startTextCamera();
    } else {
      startBarcodeCamera();
    }
  }

  scanStartBtn.addEventListener('click', startCamera);
  scanCaptureBtn.addEventListener('click', captureAndReadText);
  scanStopBtn.addEventListener('click', ()=>{
    stopCamera();
    hideScanPicker();
    setScanStatus('Camera is off.');
  });

  // ---- composite canvas for PNG download ----
  function buildTagCanvas(code, callback){
    const tmp = document.createElement('div');
    tmp.style.position='fixed'; tmp.style.left='-9999px';
    document.body.appendChild(tmp);
    new QRCode(tmp, { text: code, width: 260, height: 260, colorDark:'#1E1E1E', colorLight:'#FBF7E9', correctLevel: QRCode.CorrectLevel.M });

    setTimeout(()=>{
      const qrCanvas = tmp.querySelector('canvas');
      const out = document.createElement('canvas');
      out.width = 420; out.height = 540;
      const ctx = out.getContext('2d');

      ctx.fillStyle = '#FBF7E9';
      ctx.fillRect(0,0,out.width,out.height);
      ctx.setLineDash([8,6]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1E1E1E';
      ctx.strokeRect(10,10,out.width-20,out.height-20);
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(34,34,10,0,Math.PI*2);
      ctx.fillStyle = '#3A3F46';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FBF7E9';
      ctx.stroke();

      ctx.fillStyle = '#B8410E';
      ctx.font = '600 16px Oswald, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(typeLabels[activeTab].toUpperCase(), out.width/2, 55);

      if(qrCanvas){
        ctx.drawImage(qrCanvas, (out.width-260)/2, 75, 260, 260);
      }

      ctx.fillStyle = '#1E1E1E';
      ctx.font = '600 22px "IBM Plex Mono", monospace';
      wrapText(ctx, code, out.width/2, 380, 360, 26);

      document.body.removeChild(tmp);
      callback(out);
    }, 60);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight){
    const words = text.split('-');
    let line = '';
    const lines = [];
    words.forEach((w,i)=>{
      const test = line ? line + '-' + w : w;
      if(ctx.measureText(test).width > maxWidth && line){
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    });
    if(line) lines.push(line);
    const startY = y - ((lines.length-1)*lineHeight)/2;
    lines.forEach((l,i)=> ctx.fillText(l, x, startY + i*lineHeight));
  }

  document.getElementById('downloadBtn').addEventListener('click', async ()=>{
    actionAttempted = true;
    const code = refresh();
    if(!code) return;
    if(!(await checkUsageGate('download_png'))) return;
    trackUsage('download_png', { labelCode: code });
    buildTagCanvas(code, (canvas)=>{
      const a = document.createElement('a');
      a.download = code + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    });
  });

  // ---- batch print sheet ----
  const sheet = [];
  const sheetGrid = document.getElementById('sheetGrid');
  const sheetEmpty = document.getElementById('sheetEmpty');
  const sheetCount = document.getElementById('sheetCount');
  const printSheetEl = document.getElementById('printSheet');

  function renderSheet(){
    sheetGrid.innerHTML = '';
    sheetCount.textContent = sheet.length;
    const printBtn = document.getElementById('printBtn');
    if(printBtn){
      printBtn.disabled = sheet.length === 0;
      printBtn.title = sheet.length === 0 ? 'Add a label before printing' : 'Print sheet';
    }
    if(sheet.length === 0){
      sheetGrid.appendChild(sheetEmpty);
      printSheetEl.innerHTML = '';
      return;
    }
    sheet.forEach((item, idx)=>{
      const div = document.createElement('div');
      div.className = 'sheet-item' + (idx === sheet.length - 1 ? ' is-new' : '');
      const top = document.createElement('div');
      top.className = 'sheet-chip-top';
      const index = document.createElement('span');
      index.className = 'sheet-index';
      index.textContent = '#' + String(idx + 1).padStart(2, '0');
      top.appendChild(index);
      if(idx === sheet.length - 1){
        const badge = document.createElement('span');
        badge.className = 'sheet-new';
        badge.textContent = 'NEW';
        top.appendChild(badge);
      }
      div.appendChild(top);
      const holder = document.createElement('div');
      holder.className = 'sheet-qr';
      div.appendChild(holder);
      const codeEl = document.createElement('div');
      codeEl.className = 'code';
      codeEl.textContent = item.code;
      const rm = document.createElement('button');
      rm.className = 'remove';
      rm.type = 'button';
      rm.setAttribute('aria-label', 'Remove ' + item.code);
      rm.textContent = '×';
      rm.addEventListener('click', ()=>{ sheet.splice(idx,1); renderSheet(); });
      div.appendChild(rm);
      div.appendChild(codeEl);
      sheetGrid.appendChild(div);
      renderQR(holder, item.code, 100);
    });

    // build hidden print layout
    printSheetEl.innerHTML = '';
    sheet.forEach(item=>{
      const cell = document.createElement('div');
      cell.className = 'print-tag';
      const holder = document.createElement('div');
      cell.appendChild(holder);
      const codeEl = document.createElement('div');
      codeEl.className = 'code';
      codeEl.textContent = item.code;
      cell.appendChild(codeEl);
      printSheetEl.appendChild(cell);
      renderQR(holder, item.code, 110);
    });
  }

  document.getElementById('addToSheetBtn').addEventListener('click', async ()=>{
    actionAttempted = true;
    const code = refresh();
    if(!code) return;
    if(sheet.some(s=>s.code===code)){
      paintStatus('Already on the sheet', 'warn');
      return;
    }
    if(!(await checkUsageGate('add_to_sheet'))) return;
    sheet.push({ code, type: activeTab });
    trackUsage('add_to_sheet', { labelCode: code, sheetCount: sheet.length });
    renderSheet();
  });

  document.getElementById('clearSheetBtn').addEventListener('click', ()=>{
    sheet.length = 0;
    trackUsage('clear_sheet', { sheetCount: 0 });
    renderSheet();
  });

  document.getElementById('printBtn').addEventListener('click', async ()=>{
    if(sheet.length === 0){
      paintStatus('Add a label before printing', 'warn');
      return;
    }
    if(!(await checkUsageGate('print_sheet'))) return;
    trackUsage('print_sheet', { sheetCount: sheet.length });
    window.print();
  });

  renderSheet();

  function setPayload(value){
    const qrText = document.getElementById('qr-text');
    qrText.value = value;
    qrText.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const clearPayloadBtn = document.getElementById('clearPayloadBtn');
  if(clearPayloadBtn){
    clearPayloadBtn.addEventListener('click', ()=> setPayload(''));
  }

  function selectGroupValue(id, value){
    const group = document.getElementById(id);
    if(!group) return;
    group.dataset.value = value;
    group.querySelectorAll('.opt').forEach(o=>{
      o.classList.toggle('selected', o.textContent === value);
    });
  }

  const clearDraftBtn = document.getElementById('clearDraftBtn');
  if(clearDraftBtn){
    clearDraftBtn.addEventListener('click', ()=>{
      if(activeTab === 'qr'){
        setPayload('');
        return;
      }
      if(activeTab === 'bin'){
        const bin = getTemplates().bin.validation;
        document.getElementById('bin-xxx').value = String(bin.xxx.min);
        document.getElementById('bin-zzzz').value = String(bin.zzzz.min);
        selectGroupValue('bin-y', 'A');
      } else if(activeTab === 'cart'){
        document.getElementById('cart-xxx').value = String(getTemplates().cart.validation.xxx.min);
      } else if(activeTab === 'cartbin'){
        document.getElementById('cartbin-xxx').value = String(getTemplates().cartbin.validation.xxx.min);
        selectGroupValue('cartbin-y', 'A');
        selectGroupValue('cartbin-z', '1');
      } else if(activeTab === 'scan'){
        document.getElementById('scan-value').value = '';
      }
      refresh();
    });
  }

  const themeToggle = document.getElementById('themeToggle');
  if(themeToggle){
    themeToggle.addEventListener('click', ()=>{
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      trackUsage('theme_change', { metadata: { theme: next } });
    });
  }

  document.querySelectorAll('.step').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = document.getElementById(btn.dataset.target);
      if(!input) return;
      const dir = Number(btn.dataset.step) || 0;
      const min = Number(input.min);
      const max = Number(input.max);
      let value = parseInt(input.value, 10);
      if(!Number.isFinite(value)) value = Number.isFinite(min) ? min : 0;
      value += dir;
      if(Number.isFinite(min)) value = Math.max(min, value);
      if(Number.isFinite(max)) value = Math.min(max, value);
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  const zoomBtn = document.getElementById('zoomBtn');
  const tagStage = document.querySelector('.tag-stage');
  if(zoomBtn && tagStage){
    zoomBtn.addEventListener('click', ()=>{
      const on = tagStage.classList.toggle('is-zoomed');
      zoomBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  const analyticsOptIn = document.getElementById('analyticsOptIn');
  if(analyticsOptIn){
    analyticsOptIn.checked = isAnalyticsEnabled();
    analyticsOptIn.addEventListener('change', ()=>{
      if(analyticsOptIn.checked){
        setAnalyticsEnabled(true);
        trackUsage('analytics_enabled');
      } else {
        trackUsage('analytics_disabled');
        setAnalyticsEnabled(false);
      }
    });
  }
  applyTemplateChrome();
  loadOrgContext().finally(function(){
    trackUsage('app_open');
    try { refresh(); } catch(err) { console.error('RackTag refresh failed', err); }
  });

  activateTab(activeTab);
})();
