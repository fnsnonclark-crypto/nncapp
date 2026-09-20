let sortCol = '';
let sortAsc = true;

// ── Populate depth1 filter ──────────────────────────────
function populateFilters() {
  const d1Set = [...new Set(INDEX_DATA.items.map(i => i.depth1).filter(Boolean))];
  const sel = document.getElementById('depth1-filter');
  d1Set.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}

// ── Render ──────────────────────────────────────────────
function render() {
  const search    = document.getElementById('search').value.toLowerCase();
  const statusF   = document.getElementById('status-filter').value;
  const depth1F   = document.getElementById('depth1-filter').value;
  const tbody     = document.getElementById('table-body');
  tbody.innerHTML = '';

  let items = INDEX_DATA.items.filter(item => {
    const allText = [item.depth1, item.depth2, item.depth3, item.depth4, item.depth5, item.url, item.status, item.completedDate, item.note]
      .join(' ').toLowerCase();
    const matchSearch = !search  || allText.includes(search);
    const matchStatus = !statusF || item.status === statusF;
    const matchDepth1 = !depth1F || item.depth1 === depth1F;
    return matchSearch && matchStatus && matchDepth1;
  });

  // Sort
  if (sortCol) {
    items = [...items].sort((a, b) => {
      const va = (a[sortCol] || '').toLowerCase();
      const vb = (b[sortCol] || '').toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ?  1 : -1;
      return 0;
    });
  }

  if (items.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = `<td colspan="10">🔍 검색 결과가 없습니다.</td>`;
    tbody.appendChild(tr);
    document.getElementById('total-count').textContent = '0개 항목';
    return;
  }

  items.forEach((item, idx) => {
    const tr = document.createElement('tr');

    // File link
    let linkHtml = `<span class="dash">—</span>`;
    if (item.url) {
      const isExternal = item.url.startsWith('http');
      const label = isExternal
        ? '🔗 ' + new URL(item.url).hostname
        : '📄 ' + item.url.split('/').pop();
      linkHtml = `<a class="file-link" href="${item.url}" ${isExternal ? 'target="_blank" rel="noopener"' : ''} title="${item.url}">${label}</a>`;
    }

    // Status
    const statusHtml = item.status
      ? `<span class="status status-${item.status}">${item.status}</span>`
      : `<span class="dash">—</span>`;

    const cell = (val, cls = '') =>
      `<td class="${cls}">${val || '<span class="dash">—</span>'}</td>`;

    tr.innerHTML = `
      <td class="row-num">${idx + 1}</td>
      ${cell(item.depth1, 'depth-cell depth-1')}
      ${cell(item.depth2, 'depth-cell depth-2')}
      ${cell(item.depth3, 'depth-cell')}
      ${cell(item.depth4, 'depth-cell')}
      ${cell(item.depth5, 'depth-cell')}
      <td>${linkHtml}</td>
      <td>${statusHtml}</td>
      ${cell(item.completedDate, 'cell-date')}
      ${cell(item.note, 'cell-note')}
    `;

    tbody.appendChild(tr);
  });

  document.getElementById('total-count').textContent = `총 ${items.length}개 항목`;
}

// ── Sort ────────────────────────────────────────────────
function initSort() {
  document.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (sortCol === col) {
        sortAsc = !sortAsc;
      } else {
        sortCol = col;
        sortAsc = true;
      }
      document.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
      th.classList.add('sorted');
      const icon = th.querySelector('.sort-icon');
      if (icon) icon.textContent = sortAsc ? '↑' : '↓';
      render();
    });
  });
}

// ── Events ──────────────────────────────────────────────
function initEvents() {
  let debounce;
  document.getElementById('search').addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(render, 180);
  });
  document.getElementById('status-filter').addEventListener('change', render);
  document.getElementById('depth1-filter').addEventListener('change', render);
}

// ── Init ────────────────────────────────────────────────
function init() {
  document.getElementById('page-title').textContent = INDEX_DATA.title || 'Index';
  document.getElementById('footer').textContent =
    `마지막 업데이트: ${new Date().toLocaleDateString('ko-KR')}`;
  populateFilters();
  initSort();
  initEvents();
  render();
}

init();
