// button.js — File viewer popup functionality

(function () {

  // ── Inject popup styles ─────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #fv-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.72);
      backdrop-filter: blur(4px);
      z-index: 9000;
      align-items: center;
      justify-content: center;
    }
    #fv-overlay.open { display: flex; }

    #fv-modal {
      background: #161926;
      border: 1px solid #2e3250;
      border-radius: 12px;
      width: min(860px, 94vw);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 80px rgba(0,0,0,.6);
      animation: fv-in .18s ease;
    }
    @keyframes fv-in {
      from { opacity: 0; transform: scale(.96) translateY(8px); }
      to   { opacity: 1; transform: scale(1)  translateY(0); }
    }

    #fv-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      border-bottom: 1px solid #2e3250;
      flex-shrink: 0;
    }
    #fv-filename {
      flex: 1;
      font-size: .9rem;
      font-weight: 700;
      color: #e2e8f0;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
    }
    #fv-filename span {
      color: #7b85a0;
      font-weight: 400;
    }

    .fv-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 7px;
      font-size: .78rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #2e3250;
      background: #21253a;
      color: #7b85a0;
      transition: background .15s, color .15s, border-color .15s;
    }
    .fv-btn:hover { background: #2e3250; color: #e2e8f0; border-color: #6c8fff; }

    #fv-copy-btn.copied { color: #34d399; border-color: #34d399; }

    #fv-close-btn {
      background: transparent;
      border-color: transparent;
      font-size: 1.1rem;
      padding: 4px 8px;
    }
    #fv-close-btn:hover { background: #c0392b22; color: #ff6b6b; border-color: #ff6b6b33; }

    #fv-body {
      overflow: auto;
      padding: 0;
      flex: 1;
    }

    #fv-code-wrap {
      display: flex;
      min-height: 100%;
    }

    #fv-line-nums {
      padding: 18px 0 18px 14px;
      color: #3d4466;
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: .8rem;
      line-height: 1.65;
      text-align: right;
      user-select: none;
      flex-shrink: 0;
      min-width: 44px;
      border-right: 1px solid #2e3250;
      background: #13162033;
    }

    #fv-code {
      padding: 18px 20px;
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: .8rem;
      line-height: 1.65;
      color: #c9d1e0;
      white-space: pre;
      flex: 1;
      overflow-x: auto;
    }

    #fv-footer {
      padding: 8px 18px;
      border-top: 1px solid #2e3250;
      font-size: .75rem;
      color: #7b85a0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    /* ── Trigger buttons in header ── */
    #fv-trigger-bar {
      display: flex;
      gap: 8px;
    }

    .fv-trigger {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 13px;
      border-radius: 8px;
      font-size: .8rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #2e3250;
      background: #1a1d27;
      color: #7b85a0;
      transition: background .15s, color .15s, border-color .15s;
    }
    .fv-trigger:hover { background: #21253a; color: #6c8fff; border-color: #6c8fff44; }

    /* ── Syntax colours (basic) ── */
    .syn-kw   { color: #a78bfa; }
    .syn-str  { color: #86efac; }
    .syn-num  { color: #fbbf24; }
    .syn-cmt  { color: #4a5580; font-style: italic; }
    .syn-fn   { color: #6c8fff; }
    .syn-bool { color: #f97316; }
  `;
  document.head.appendChild(style);

  // ── Build popup DOM ─────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'fv-overlay';
  overlay.innerHTML = `
    <div id="fv-modal" role="dialog" aria-modal="true">
      <div id="fv-header">
        <span id="fv-filename">파일명</span>
        <button id="fv-copy-btn" class="fv-btn" title="클립보드에 복사">📋 복사</button>
        <button id="fv-close-btn" class="fv-btn" title="닫기 (ESC)">✕</button>
      </div>
      <div id="fv-body">
        <div id="fv-code-wrap">
          <div id="fv-line-nums"></div>
          <div id="fv-code"></div>
        </div>
      </div>
      <div id="fv-footer">
        <span id="fv-info"></span>
        <span>ESC 또는 바깥 클릭으로 닫기</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // ── Syntax highlight (lightweight, regex-based) ─────────
  function highlight(code) {
    // Escape HTML first
    code = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments (must come before strings)
    code = code.replace(/(\/\/[^\n]*)/g, '<span class="syn-cmt">$1</span>');

    // Template literals & strings (simplified)
    code = code.replace(/(`[^`]*`)/g, '<span class="syn-str">$1</span>');
    code = code.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="syn-str">$1</span>');
    code = code.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="syn-str">$1</span>');

    // Keywords
    const kws = /\b(const|let|var|function|return|if|else|for|of|await|async|new|true|false|null|undefined|this|class|import|export|default)\b/g;
    code = code.replace(kws, '<span class="syn-kw">$1</span>');

    // Numbers
    code = code.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="syn-num">$1</span>');

    return code;
  }

  // ── Render content into popup ───────────────────────────
  function displayContent(filename, raw) {
    const lines = raw.split('\n');

    // Line numbers
    document.getElementById('fv-line-nums').textContent =
      lines.map((_, i) => i + 1).join('\n');

    // Highlighted code
    document.getElementById('fv-code').innerHTML = highlight(raw);

    // Header / footer info
    document.getElementById('fv-filename').innerHTML =
      `<span>📄 </span>${filename}`;
    document.getElementById('fv-info').textContent =
      `${lines.length}줄 · ${(new Blob([raw]).size / 1024).toFixed(1)} KB`;

    // Store raw for copy
    overlay._rawContent = raw;
  }

  // ── Fetch file content ──────────────────────────────────
  async function showFilePopup(filename) {
    displayContent(filename, '불러오는 중...');
    open();

    try {
      const res = await fetch(filename + '?nocache=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      displayContent(filename, text);
    } catch (e) {
      // Fallback: for data.js, serialize the loaded object
      if (filename === 'data.js' && typeof INDEX_DATA !== 'undefined') {
        const fallback = 'const INDEX_DATA = ' + JSON.stringify(INDEX_DATA, null, 2) + ';';
        displayContent(filename, fallback);
      } else {
        displayContent(filename,
          `// ⚠ 파일을 직접 읽을 수 없습니다.\n//   file:// 프로토콜 보안 제한으로 인해 fetch가 차단되었을 수 있습니다.\n//\n//   파일 경로: ${filename}\n//   오류: ${e.message}`
        );
      }
    }
  }

  // ── Open / Close ────────────────────────────────────────
  function open()  { overlay.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function close() { overlay.classList.remove('open'); document.body.style.overflow = ''; }

  // Close on backdrop click
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  // ESC key
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // Close button
  document.getElementById('fv-close-btn').addEventListener('click', close);

  // Copy button
  document.getElementById('fv-copy-btn').addEventListener('click', async () => {
    const btn = document.getElementById('fv-copy-btn');
    await navigator.clipboard.writeText(overlay._rawContent || '');
    btn.textContent = '✅ 복사됨';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 복사'; btn.classList.remove('copied'); }, 1800);
  });

  // ── Inject trigger buttons into header ──────────────────
  window.addEventListener('DOMContentLoaded', injectButtons);
  if (document.readyState !== 'loading') injectButtons();

  function injectButtons() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('fv-trigger-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'fv-trigger-bar';
    bar.innerHTML = `
      <button class="fv-trigger" data-file="data.js">📦 data.js</button>
      <button class="fv-trigger" data-file="app.js">⚙️ app.js</button>
    `;
    header.insertBefore(bar, header.firstChild);

    bar.querySelectorAll('.fv-trigger').forEach(btn => {
      btn.addEventListener('click', () => showFilePopup(btn.dataset.file));
    });
  }

})();
