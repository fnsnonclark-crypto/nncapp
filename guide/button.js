// button.js — File viewer popup functionality

(function () {

  // ── Inject popup styles ─────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #fv-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9000;
    }
    #fv-overlay.open { display: block; }

    #fv-modal {
      position: fixed;
      inset: 0;
      background: #161926;
      display: flex;
      flex-direction: column;
      animation: fv-in .15s ease;
    }
    @keyframes fv-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    #fv-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 22px;
      border-bottom: 2px solid #2e3250;
      flex-shrink: 0;
      background: #0f1117;
    }
    #fv-filename {
      flex: 1;
      font-size: .95rem;
      font-weight: 700;
      color: #e2e8f0;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
    }
    #fv-filename .fv-icon { color: #7b85a0; font-weight: 400; margin-right: 4px; }

    .fv-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      border-radius: 7px;
      font-size: .8rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #2e3250;
      background: #21253a;
      color: #7b85a0;
      transition: background .15s, color .15s, border-color .15s;
    }
    .fv-btn:hover { background: #2e3250; color: #e2e8f0; border-color: #6c8fff; }
    #fv-copy-btn.copied { color: #34d399; border-color: #34d399; background: #34d39915; }
    #fv-close-btn {
      font-size: 1rem;
      padding: 5px 12px;
      background: transparent;
      border-color: transparent;
    }
    #fv-close-btn:hover { background: #ff6b6b18; color: #ff6b6b; border-color: #ff6b6b44; }

    /* ── Main body: takes all remaining height ── */
    #fv-body {
      flex: 1;
      display: flex;
      overflow: hidden;
      min-height: 0;
    }

    #fv-code-wrap {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Line numbers scroll in sync with code via JS */
    #fv-line-nums {
      padding: 20px 12px 20px 18px;
      color: #3a3f5c;
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: .82rem;
      line-height: 1.7;
      text-align: right;
      user-select: none;
      flex-shrink: 0;
      width: 58px;
      border-right: 1px solid #2e3250;
      background: #0c0e18;
      overflow: hidden;
      white-space: pre;
    }

    #fv-code {
      padding: 20px 28px 20px 20px;
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: .82rem;
      line-height: 1.7;
      color: #c9d1e0;
      white-space: pre;
      flex: 1;
      overflow: auto;
      tab-size: 2;
      -moz-tab-size: 2;
    }

    #fv-footer {
      padding: 9px 22px;
      border-top: 1px solid #2e3250;
      font-size: .75rem;
      color: #7b85a0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      background: #0f1117;
    }

    /* ── Trigger buttons ── */
    #fv-trigger-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 2px;
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
    .fv-trigger:hover { background: #21253a; color: #6c8fff; border-color: #6c8fff66; }

    /* ── Syntax colours ── */
    .syn-kw  { color: #a78bfa; }
    .syn-str { color: #86efac; }
    .syn-num { color: #fbbf24; }
    .syn-cmt { color: #4a5580; font-style: italic; }
  `;
  document.head.appendChild(style);

  // ── Build popup DOM ─────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'fv-overlay';
  overlay.innerHTML = `
    <div id="fv-modal" role="dialog" aria-modal="true">
      <div id="fv-header">
        <span id="fv-filename"><span class="fv-icon">📄</span>파일명</span>
        <button id="fv-copy-btn" class="fv-btn">📋 복사</button>
        <button id="fv-close-btn" class="fv-btn">✕ 닫기</button>
      </div>
      <div id="fv-body">
        <div id="fv-code-wrap">
          <div id="fv-line-nums"></div>
          <div id="fv-code"></div>
        </div>
      </div>
      <div id="fv-footer">
        <span id="fv-info"></span>
        <span>ESC 또는 닫기 버튼으로 닫기</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const elLineNums = document.getElementById('fv-line-nums');
  const elCode     = document.getElementById('fv-code');

  // ── Sync scroll: line nums follow code vertically ───────
  elCode.addEventListener('scroll', () => {
    elLineNums.scrollTop = elCode.scrollTop;
  });

  // ── Syntax highlight ────────────────────────────────────
  function highlight(code) {
    code = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Single-line comments
    code = code.replace(/(\/\/[^\n]*)/g, '<span class="syn-cmt">$1</span>');

    // Strings (template literals, double/single quoted)
    code = code.replace(/(`(?:[^`\\]|\\.|\n)*?`)/g, '<span class="syn-str">$1</span>');
    code = code.replace(/(\"(?:[^\"\\]|\\.)*\")/g,  '<span class="syn-str">$1</span>');
    code = code.replace(/(\'(?:[^\'\\]|\\.)*\')/g,  '<span class="syn-str">$1</span>');

    // Keywords
    code = code.replace(
      /\b(const|let|var|function|return|if|else|for|of|in|while|do|await|async|new|true|false|null|undefined|this|class|import|export|default|typeof|instanceof)\b/g,
      '<span class="syn-kw">$1</span>'
    );

    // Numbers
    code = code.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="syn-num">$1</span>');

    return code;
  }

  // ── Render content into popup ───────────────────────────
  function displayContent(filename, raw) {
    const lines = raw.split('\n');

    elLineNums.textContent = lines.map((_, i) => i + 1).join('\n');
    elCode.innerHTML = highlight(raw);

    document.getElementById('fv-filename').innerHTML =
      `<span class="fv-icon">📄 </span>${filename}`;
    document.getElementById('fv-info').textContent =
      `${lines.length}줄  ·  ${(new Blob([raw]).size / 1024).toFixed(1)} KB`;

    overlay._rawContent = raw;

    // Reset scroll
    elCode.scrollTop = 0;
    elLineNums.scrollTop = 0;
  }

  // ── Fetch file content ──────────────────────────────────
  async function showFilePopup(filename) {
    displayContent(filename, '불러오는 중...');
    openPopup();

    try {
      const res = await fetch(filename + '?t=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      displayContent(filename, text);
    } catch (e) {
      if (filename === 'data.js' && typeof INDEX_DATA !== 'undefined') {
        const fallback = 'const INDEX_DATA = ' + JSON.stringify(INDEX_DATA, null, 2) + ';';
        displayContent(filename, fallback);
      } else {
        displayContent(filename,
          `// ⚠ 파일을 직접 읽을 수 없습니다.\n//   file:// 프로토콜 보안 제한으로 fetch가 차단되었을 수 있습니다.\n//\n//   파일 경로: ${filename}\n//   오류: ${e.message}\n//\n//   해결 방법: 로컬 서버(예: Live Server, python -m http.server)로 실행하세요.`
        );
      }
    }
  }

  // ── Open / Close ────────────────────────────────────────
  function openPopup()  {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closePopup() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });
  document.getElementById('fv-close-btn').addEventListener('click', closePopup);

  document.getElementById('fv-copy-btn').addEventListener('click', async () => {
    const btn = document.getElementById('fv-copy-btn');
    try {
      await navigator.clipboard.writeText(overlay._rawContent || '');
      btn.textContent = '✅ 복사됨';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '📋 복사'; btn.classList.remove('copied'); }, 2000);
    } catch {
      btn.textContent = '❌ 실패';
      setTimeout(() => { btn.textContent = '📋 복사'; }, 2000);
    }
  });

  // ── Inject trigger buttons into header ──────────────────
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

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', injectButtons);
  } else {
    injectButtons();
  }

})();
