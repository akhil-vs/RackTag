(function(){
  // populate button-group selectors (levels A–N, bin slots 1–6)
  const letters = Array.from({length:14}, (_,i)=>String.fromCharCode(65+i)); // A–N
  const slots = Array.from({length:6}, (_,i)=>String(i+1)); // 1–6

  const SHEET_KEY = 'racktag-print-sheet';
  const TAB_PREF_KEY = 'racktag-tab-pref';
  const INSTALL_DISMISS_KEY = 'racktag-install-dismissed';

  function hapticSuccess(){
    if(navigator.vibrate) navigator.vibrate(50);
  }

  let wakeLock = null;
  async function acquireWakeLock(){
    if(!('wakeLock' in navigator)) return;
    try{
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', ()=>{ wakeLock = null; });
    }catch(e){}
  }
  async function releaseWakeLock(){
    if(wakeLock){
      try{ await wakeLock.release(); }catch(e){}
      wakeLock = null;
    }
  }

  function loadSheet(){
    try{
      const raw = localStorage.getItem(SHEET_KEY);
      if(!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data.filter(i=>i && i.code) : [];
    }catch(e){
      return [];
    }
  }

  function saveSheet(){
    try{
      localStorage.setItem(SHEET_KEY, JSON.stringify(sheet));
    }catch(e){}
  }

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
  let activeTab = 'scan';

  function switchTab(tabName){
    const tab = document.querySelector('.tab[data-tab="' + tabName + '"]');
    if(tab) tab.click();
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
      try{ localStorage.setItem(TAB_PREF_KEY, activeTab); }catch(e){}
      updateVerifyUI();
      refresh();
    });
  });

  function updateVerifyUI(){
    const isVerify = getScanMode() === 'verify';
    document.getElementById('verify-expected-field').style.display = isVerify ? 'block' : 'none';
    document.getElementById('scan-value-field').style.display = isVerify ? 'none' : 'block';
    if(!isVerify){
      document.getElementById('verify-result').style.display = 'none';
    }
  }

  function showVerifyResult(match, scanned, expected){
    const el = document.getElementById('verify-result');
    el.style.display = 'block';
    el.className = 'verify-result ' + (match ? 'match' : 'mismatch');
    el.textContent = match
      ? 'Match — ' + scanned
      : 'Mismatch — got "' + scanned + '", expected "' + expected + '"';
    if(match) hapticSuccess();
  }

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
      if(getScanMode() === 'verify'){
        const expected = document.getElementById('verify-expected').value.trim();
        if(!expected) return null;
        return expected;
      }
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
    text: 'Read text mode — point at printed text, tap Scan words, then tap a highlighted word to use it.',
    verify: 'Verify mode — enter the expected code, scan the printed label, and confirm it matches.'
  };

  scanModeGroup.querySelectorAll('.opt').forEach(opt=>{
    opt.addEventListener('click', ()=>{
      if(scanStream || zxReader) stopCamera();
      scanModeGroup.dataset.value = opt.dataset.v;
      scanModeGroup.querySelectorAll('.opt').forEach(o=>o.classList.remove('selected'));
      opt.classList.add('selected');
      scanModeHint.textContent = scanModeHints[opt.dataset.v];
      updateVerifyUI();
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
    if(getScanMode() === 'verify'){
      const expected = document.getElementById('verify-expected').value.trim();
      if(expected) showVerifyResult(code === expected, code, expected);
    } else {
      hapticSuccess();
    }
    refresh();
  }

  function selectWord(text, boxEl){
    scanWordLayer.querySelectorAll('.scan-word-box').forEach(b=>b.classList.remove('selected'));
    if(boxEl) boxEl.classList.add('selected');
    scanValue.value = text;
    setScanStatus('Selected: ' + text, 'success');
    if(getScanMode() === 'verify'){
      const expected = document.getElementById('verify-expected').value.trim();
      if(expected) showVerifyResult(text === expected, text, expected);
    } else {
      hapticSuccess();
    }
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
    if(getScanMode() === 'verify'){
      const expected = document.getElementById('verify-expected').value.trim();
      const scanned = codes[0];
      if(!expected){
        setScanStatus('Enter the expected code before scanning.', 'fail');
        return;
      }
      showVerifyResult(scanned === expected, scanned, expected);
      setScanStatus(scanned === expected ? 'Verified: ' + scanned : 'Mismatch detected.', scanned === expected ? 'success' : 'fail');
      return;
    }
    if(codes.length === 1){
      scanValue.value = codes[0];
      hideScanPicker();
      setScanStatus('Decoded: ' + codes[0], 'success');
      hapticSuccess();
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

  async function ensureTesseractWorker(){
    if(typeof Tesseract === 'undefined'){
      throw new Error('Text reader failed to load. Connect to the network and reload the page.');
    }
    if(!navigator.onLine){
      throw new Error('Text reader requires a network connection on first use.');
    }
    if(!tesseractWorker){
      setScanStatus('Loading text reader (first time may take a moment)…', 'loading');
      tesseractWorker = await Tesseract.createWorker('eng');
    }
    return tesseractWorker;
  }

  function captureVideoFrame(){
    const rect = scanVideoWrap.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const vw = scanVideo.videoWidth;
    const vh = scanVideo.videoHeight;
    const scale = Math.max(width / vw, height / vh);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;
    ctx.drawImage(scanVideo, sx, sy, sw, sh, 0, 0, width, height);
    return { canvas, width, height };
  }

  function renderWordBoxes(words, width, height){
    clearWordBoxes();
    let count = 0;
    words.forEach(word=>{
      const text = word.text.trim();
      if(!text || word.confidence < 20) return;
      const { x0, y0, x1, y1 } = word.bbox;
      if(x1 <= x0 || y1 <= y0) return;
      const box = document.createElement('button');
      box.type = 'button';
      box.className = 'scan-word-box';
      box.textContent = text;
      box.style.left = (x0 / width * 100) + '%';
      box.style.top = (y0 / height * 100) + '%';
      box.style.width = ((x1 - x0) / width * 100) + '%';
      box.style.height = ((y1 - y0) / height * 100) + '%';
      box.addEventListener('click', ()=> selectWord(text, box));
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
    setScanStatus('Reading text… hold steady.', 'loading');
    try{
      const worker = await ensureTesseractWorker();
      const { canvas, width, height } = captureVideoFrame();
      const { data } = await worker.recognize(canvas);
      const count = renderWordBoxes(data.words || [], width, height);
      if(count === 0){
        setScanStatus('No readable words found — adjust framing and try again.', 'fail');
      } else {
        setScanStatus(count + ' word' + (count === 1 ? '' : 's') + ' found — tap a box to use it.', 'success');
      }
    }catch(err){
      const offline = !navigator.onLine || (err && err.message && err.message.includes('network'));
      setScanStatus(
        offline
          ? 'Text reader needs a network connection. Connect to load it, or type the value manually.'
          : 'Text scan failed — try again or type the value manually.',
        'fail'
      );
    }finally{
      ocrBusy = false;
      scanCaptureBtn.disabled = false;
    }
  }

  function stopCamera(){
    releaseWakeLock();
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
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
    if(getScanMode() === 'verify'){
      const expected = document.getElementById('verify-expected').value.trim();
      if(!expected){
        setScanStatus('Enter the expected code before starting the camera.', 'fail');
        return;
      }
    }
    scanStartBtn.disabled = true;
    scanStopBtn.disabled = false;
    scanVideoWrap.style.display = 'block';
    hideScanPicker();
    clearWordBoxes();
    acquireWakeLock();

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

  document.getElementById('verify-expected').addEventListener('input', refresh);
  document.getElementById('verifyUseCurrentBtn').addEventListener('click', ()=>{
    const current = document.getElementById('tagCode').textContent.trim();
    if(current && current !== '—'){
      document.getElementById('verify-expected').value = current;
      refresh();
      return;
    }
    const scanned = document.getElementById('scan-value').value.trim();
    if(scanned){
      document.getElementById('verify-expected').value = scanned;
      refresh();
    }
  });

  // ---- composite canvas for PNG download ----
  function buildTagCanvas(code, callback, labelType){
    const typeLabel = typeLabels[labelType || activeTab] || 'Label';
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
      ctx.fillText(typeLabel.toUpperCase(), out.width/2, 55);

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

  function downloadCanvas(canvas, filename){
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  document.getElementById('downloadBtn').addEventListener('click', ()=>{
    const code = refresh();
    if(!code) return;
    buildTagCanvas(code, (canvas)=> downloadCanvas(canvas, code + '.png'));
  });

  document.getElementById('mobileAddBtn').addEventListener('click', ()=>{
    document.getElementById('addToSheetBtn').click();
  });
  document.getElementById('mobileDownloadBtn').addEventListener('click', ()=>{
    document.getElementById('downloadBtn').click();
  });
  document.getElementById('mobilePrintBtn').addEventListener('click', ()=>{
    document.getElementById('printBtn').click();
  });

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

  // ---- batch print sheet ----
  const sheet = loadSheet();
  const sheetGrid = document.getElementById('sheetGrid');
  const sheetEmpty = document.getElementById('sheetEmpty');
  const sheetCount = document.getElementById('sheetCount');
  const printSheetEl = document.getElementById('printSheet');
  const printOneSheetEl = document.getElementById('printOneSheet');
  let previewItem = null;

  function openSheetPreview(item){
    previewItem = item;
    document.getElementById('sheetPreviewModal').style.display = 'flex';
    document.getElementById('sheetPreviewEyebrow').textContent = typeLabels[item.type] || 'Label';
    document.getElementById('sheetPreviewCode').textContent = item.code;
    renderQR(document.getElementById('sheetPreviewQr'), item.code, 150);
  }

  function closeSheetPreview(){
    previewItem = null;
    document.getElementById('sheetPreviewModal').style.display = 'none';
  }

  document.getElementById('sheetPreviewClose').addEventListener('click', closeSheetPreview);
  document.getElementById('sheetPreviewBackdrop').addEventListener('click', closeSheetPreview);
  document.getElementById('sheetPreviewDownload').addEventListener('click', ()=>{
    if(!previewItem) return;
    buildTagCanvas(previewItem.code, (canvas)=> downloadCanvas(canvas, previewItem.code + '.png'), previewItem.type);
  });
  document.getElementById('sheetPreviewPrintOne').addEventListener('click', ()=>{
    if(!previewItem) return;
    printOneSheetEl.innerHTML = '';
    const cell = document.createElement('div');
    cell.className = 'print-tag';
    const holder = document.createElement('div');
    cell.appendChild(holder);
    const codeEl = document.createElement('div');
    codeEl.className = 'code';
    codeEl.textContent = previewItem.code;
    cell.appendChild(codeEl);
    printOneSheetEl.appendChild(cell);
    renderQR(holder, previewItem.code, 160);
    document.body.classList.add('print-one');
    window.print();
    document.body.classList.remove('print-one');
  });

  function renderSheet(){
    sheetGrid.innerHTML = '';
    sheetCount.textContent = sheet.length;
    saveSheet();
    if(sheet.length === 0){
      sheetGrid.appendChild(sheetEmpty);
      printSheetEl.innerHTML = '';
      return;
    }
    sheet.forEach((item, idx)=>{
      const div = document.createElement('div');
      div.className = 'sheet-item';
      div.addEventListener('click', (e)=>{
        if(e.target.classList.contains('remove')) return;
        openSheetPreview(item);
      });
      const holder = document.createElement('div');
      div.appendChild(holder);
      const codeEl = document.createElement('div');
      codeEl.className = 'code';
      codeEl.textContent = item.code;
      const rm = document.createElement('button');
      rm.className = 'remove';
      rm.type = 'button';
      rm.textContent = '×';
      rm.addEventListener('click', (e)=>{
        e.stopPropagation();
        sheet.splice(idx,1);
        renderSheet();
      });
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
    renderSheet();
  });

  document.getElementById('clearSheetBtn').addEventListener('click', ()=>{
    sheet.length = 0;
    renderSheet();
  });

  document.getElementById('printBtn').addEventListener('click', ()=>{
    if(sheet.length === 0) return;
    window.print();
  });

  document.getElementById('shareSheetBtn').addEventListener('click', async ()=>{
    if(sheet.length === 0) return;
    const text = 'RackTag print sheet\n\n' + sheet.map(s=>s.code).join('\n');
    if(navigator.share){
      try{
        await navigator.share({ title: 'RackTag print sheet', text });
        return;
      }catch(e){
        if(e.name === 'AbortError') return;
      }
    }
    try{
      await navigator.clipboard.writeText(text);
      statusLine.textContent = 'Sheet copied to clipboard';
      statusLine.classList.add('ok');
      setTimeout(()=> refresh(), 2000);
    }catch(e){
      statusLine.textContent = 'Could not share or copy sheet';
      statusLine.classList.remove('ok');
    }
  });

  // ---- PWA install prompt ----
  let deferredInstallPrompt = null;
  const installBanner = document.getElementById('installBanner');
  const installBtn = document.getElementById('installBtn');
  const installDismissBtn = document.getElementById('installDismissBtn');

  window.addEventListener('beforeinstallprompt', (e)=>{
    if(localStorage.getItem(INSTALL_DISMISS_KEY)) return;
    e.preventDefault();
    deferredInstallPrompt = e;
    installBanner.style.display = 'flex';
  });

  installBtn.addEventListener('click', async ()=>{
    if(!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBanner.style.display = 'none';
  });

  installDismissBtn.addEventListener('click', ()=>{
    try{ localStorage.setItem(INSTALL_DISMISS_KEY, '1'); }catch(e){}
    installBanner.style.display = 'none';
  });

  // ---- default to scan on mobile ----
  (function initMobileDefaults(){
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    let pref = null;
    try{ pref = localStorage.getItem(TAB_PREF_KEY); }catch(e){}
    if(pref && panels[pref]){
      switchTab(pref);
    } else if(isMobile){
      switchTab('scan');
      const autoScan = !localStorage.getItem('racktag-auto-scan-done');
      if(autoScan && scanStartBtn){
        try{ localStorage.setItem('racktag-auto-scan-done', '1'); }catch(e){}
        setTimeout(()=>{
          if(activeTab === 'scan' && getScanMode() !== 'verify') scanStartBtn.click();
        }, 600);
      }
    }
    updateVerifyUI();
    refresh();
  })();

  renderSheet();
})();
