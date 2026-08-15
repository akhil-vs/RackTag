(function(){
  // populate button-group selectors (levels A–N, bin slots 1–6)
  const letters = Array.from({length:14}, (_,i)=>String.fromCharCode(65+i)); // A–N
  const slots = Array.from({length:6}, (_,i)=>String(i+1)); // 1–6

  function buildButtonGroup(id, values){
    const group = document.getElementById(id);
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

  const tabs = document.querySelectorAll('.tab');
  const panels = { bin:'panel-bin', cart:'panel-cart', cartbin:'panel-cartbin', scan:'panel-scan' };
  const typeLabels = { bin:'Bin location', cart:'Cart number', cartbin:'Cart bin number', scan:'Scanned barcode' };
  let activeTab = 'bin';

  const ANALYTICS_OPT_KEY = 'racktag_analytics_opt_in';
  const ANALYTICS_SESSION_KEY = 'racktag_analytics_session';

  function getAnalyticsSessionId(){
    let id = localStorage.getItem(ANALYTICS_SESSION_KEY);
    if(!id){
      id = (crypto.randomUUID && crypto.randomUUID()) || (Date.now() + '-' + Math.random().toString(16).slice(2));
      localStorage.setItem(ANALYTICS_SESSION_KEY, id);
    }
    return id;
  }

  function isAnalyticsEnabled(){
    const stored = localStorage.getItem(ANALYTICS_OPT_KEY);
    if(stored === null) return true;
    return stored === '1';
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
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function(){});
  }

  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      Object.values(panels).forEach(id=>document.getElementById(id).style.display='none');
      if(activeTab === 'scan' && t.dataset.tab !== 'scan' && typeof stopCamera === 'function'){
        stopCamera();
      }
      activeTab = t.dataset.tab;
      document.getElementById(panels[activeTab]).style.display='block';
      document.getElementById('typeLabel').textContent = typeLabels[activeTab];
      document.getElementById('tagEyebrow').textContent = typeLabels[activeTab];
      trackUsage('tab_change', { metadata: { tab: activeTab } });
      refresh();
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

  function computeCode(){
    if(activeTab === 'bin'){
      const xxx = parseInt(document.getElementById('bin-xxx').value, 10);
      const y = document.getElementById('bin-y').dataset.value;
      const zzzz = parseInt(document.getElementById('bin-zzzz').value, 10);
      const xxxOk = Number.isInteger(xxx) && xxx >= 101 && xxx <= 113;
      const zzzzOk = Number.isInteger(zzzz) && zzzz >= 1000 && zzzz <= 1999;
      setError('bin-xxx-field', !xxxOk);
      setError('bin-zzzz-field', !zzzzOk);
      if(!xxxOk || !zzzzOk) return null;
      return `P-01-A-${xxx}-${y}-${zzzz}`;
    }
    if(activeTab === 'cart'){
      const xxx = parseInt(document.getElementById('cart-xxx').value, 10);
      const ok = Number.isInteger(xxx) && xxx >= 1 && xxx <= 999;
      setError('cart-xxx-field', !ok);
      if(!ok) return null;
      return `CRT-MAN1-${formatNum(xxx)}`;
    }
    if(activeTab === 'cartbin'){
      const xxx = parseInt(document.getElementById('cartbin-xxx').value, 10);
      const y = document.getElementById('cartbin-y').dataset.value;
      const z = parseInt(document.getElementById('cartbin-z').dataset.value, 10);
      const xxxOk = Number.isInteger(xxx) && xxx >= 1 && xxx <= 999;
      setError('cartbin-xxx-field', !xxxOk);
      if(!xxxOk) return null;
      return `CRT-MAN1-${formatNum(xxx)}-${y}-${formatNum(z)}`;
    }
    if(activeTab === 'scan'){
      const val = document.getElementById('scan-value').value.trim();
      const ok = val.length > 0;
      setError('scan-value-field', !ok);
      if(!ok) return null;
      return val;
    }
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

  function refresh(){
    const code = computeCode();
    if(code){
      renderQR(qrHolder, code, 150);
      tagCode.textContent = code;
      statusLine.textContent = 'Ready to print or save';
      statusLine.classList.add('ok');
    } else {
      qrHolder.innerHTML = '';
      tagCode.textContent = '—';
      statusLine.textContent = 'Fix the highlighted field to generate a label';
      statusLine.classList.remove('ok');
    }
    return code;
  }

  ['cart-xxx', 'cartbin-xxx'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', ()=>{ normalizeCartInput(el); refresh(); });
    el.addEventListener('change', ()=>{ normalizeCartInput(el); refresh(); });
  });

  document.querySelectorAll('input, select').forEach(el=>{
    if(el.id === 'cart-xxx' || el.id === 'cartbin-xxx') return;
    el.addEventListener('input', refresh);
    el.addEventListener('change', refresh);
  });

  refresh();

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
    text: 'Read text mode — fill the frame with the text on screen, hold steady, then tap Scan words. For phone/computer screens, reduce glare and use max brightness.'
  };

  scanModeGroup.querySelectorAll('.opt').forEach(opt=>{
    opt.addEventListener('click', ()=>{
      if(scanStream || zxReader) stopCamera();
      scanModeGroup.dataset.value = opt.dataset.v;
      scanModeGroup.querySelectorAll('.opt').forEach(o=>o.classList.remove('selected'));
      opt.classList.add('selected');
      scanModeHint.textContent = scanModeHints[opt.dataset.v];
    });
  });

  function getScanMode(){
    return scanModeGroup.dataset.value || 'barcode';
  }

  function setScanStatus(text, cls){
    scanStatus.textContent = text;
    scanStatus.className = 'scan-status' + (cls ? ' ' + cls : '');
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

  document.getElementById('downloadBtn').addEventListener('click', ()=>{
    const code = refresh();
    if(!code) return;
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
    if(sheet.length === 0){
      sheetGrid.appendChild(sheetEmpty);
      printSheetEl.innerHTML = '';
      return;
    }
    sheet.forEach((item, idx)=>{
      const div = document.createElement('div');
      div.className = 'sheet-item';
      const holder = document.createElement('div');
      div.appendChild(holder);
      const codeEl = document.createElement('div');
      codeEl.className = 'code';
      codeEl.textContent = item.code;
      const rm = document.createElement('button');
      rm.className = 'remove';
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

  document.getElementById('addToSheetBtn').addEventListener('click', ()=>{
    const code = refresh();
    if(!code) return;
    if(sheet.some(s=>s.code===code)) return; // avoid duplicates
    sheet.push({ code, type: activeTab });
    trackUsage('add_to_sheet', { labelCode: code, sheetCount: sheet.length });
    renderSheet();
  });

  document.getElementById('clearSheetBtn').addEventListener('click', ()=>{
    sheet.length = 0;
    trackUsage('clear_sheet', { sheetCount: 0 });
    renderSheet();
  });

  document.getElementById('printBtn').addEventListener('click', ()=>{
    if(sheet.length === 0) return;
    trackUsage('print_sheet', { sheetCount: sheet.length });
    window.print();
  });

  renderSheet();

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
  trackUsage('app_open');
})();
