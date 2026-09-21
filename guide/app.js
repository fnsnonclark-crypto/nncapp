/**
 * ==============================================================================
 * app.js - 인덱스 목록 페이지 핵심 스크립트
 * ==============================================================================
 * 역할:
 * 1. data.js의 INDEX_DATA를 바탕으로 테이블 목록 동적 렌더링
 * 2. 실시간 검색(디바운스 적용), 상태별/depth별 필터링
 * 3. 컬럼별 오름차순/내림차순 정렬
 * 4. 크롬 110 이하 및 구형 브라우저 호환을 위한 예외 방어 처리
 * ==============================================================================
 */

// ==============================================================================
// 1. 전역 상태 변수 (Global State Variables)
// ==============================================================================

/**
 * @type {string} sortCol
 * 현재 정렬의 기준이 되는 데이터 컬럼의 속성명 (예: 'depth1', 'status', 'completedDate' 등).
 * 빈 문자열('')일 경우 기본 등록 순서대로 표시됩니다.
 */
let sortCol = '';

/**
 * @type {boolean} sortAsc
 * 정렬 방향 플래그.
 * - true: 오름차순 (A->Z, 가->하, 과거->최신, ↑)
 * - false: 내림차순 (Z->A, 하->가, 최신->과거, ↓)
 */
let sortAsc = true;


// ==============================================================================
// 2. 데이터 접근 헬퍼 함수 (Data Access Helper)
// ==============================================================================

/**
 * INDEX_DATA 객체에서 items 배열을 안전하게 추출하는 함수.
 * 
 * - data.js 파일이 아직 로드되지 않았거나, 전역 INDEX_DATA가 정의되지 않은 경우에도
 *   스크립트 에러(TypeError: Cannot read properties of undefined)가 발생하지 않도록 방어합니다.
 * 
 * @returns {Array<Object>} 항목 데이터 객체 배열 (유효하지 않을 경우 빈 배열 반환)
 */
function getItems() {
  if (typeof INDEX_DATA !== 'undefined' && Array.isArray(INDEX_DATA.items)) {
    return INDEX_DATA.items;
  }
  return [];
}


// ==============================================================================
// 3. 필터 옵션 구성 함수 (Populate Filters)
// ==============================================================================

/**
 * 1depth 드롭다운 필터(<select id="depth1-filter">)의 선택 항목을 데이터 기반으로 동적 생성하는 함수.
 * 
 * 동작 과정:
 * 1. 전체 데이터에서 depth1 속성값만 추출
 * 2. Boolean 필터로 빈 값이나 undefined 제거
 * 3. Set 객체를 활용하여 중복된 1depth 명칭 제거
 * 4. 첫 번째 기본 옵션("전체 1depth")을 유지한 채 새로운 <option> 요소들을 드롭다운에 추가
 */
function populateFilters() {
  const items = getItems();

  // 1depth 값 중 유효한 값만 골라 중복을 제거한 배열 생성
  const d1Set = [...new Set(items.map(i => i.depth1).filter(Boolean))];

  // 1depth 필터 셀렉트 박스 DOM 참조
  const sel = document.getElementById('depth1-filter');
  if (!sel) return;

  // 기존에 동적으로 추가되었던 옵션들을 초기화 (첫 번째 "전체 1depth" 옵션만 보존)
  while (sel.options.length > 1) {
    sel.remove(1);
  }

  // 중복 제거된 1depth 목록을 순회하며 새로운 <option> 엘리먼트 생성 및 추가
  d1Set.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}


// ==============================================================================
// 4. 테이블 렌더링 함수 (Render Table)
// ==============================================================================

/**
 * 검색어, 선택된 필터 조건, 정렬 상태를 종합하여 테이블 본문(<tbody>)을 다시 그리는 메인 렌더링 함수.
 * 
 * 동작 과정:
 * 1. 사용자가 입력한 검색어(search)와 선택된 필터(status, depth1) 값 읽기
 * 2. 9개 필드의 문자열을 결합하여 대소문자 구분 없는 부분 일치 검색 수행
 * 3. 정렬 기준 컬럼(sortCol)이 지정되어 있으면 문자열 기반 오름차순/내림차순 정렬 수행
 * 4. 결과가 0건일 경우 안내 문구 표시, 있을 경우 각 행(<tr>)을 생성하여 DOM에 추가
 * 5. 상단 헤더에 필터링된 총 항목 수 업데이트
 */
function render() {
  // DOM 엘리먼트 참조
  const searchInput = document.getElementById('search');          // 검색 입력창
  const statusFilter = document.getElementById('status-filter');  // 상태 필터 드롭다운
  const depth1Filter = document.getElementById('depth1-filter');  // 1depth 필터 드롭다운
  const tbody = document.getElementById('table-body');            // 테이블 본문 (tbody)
  const totalCount = document.getElementById('total-count');      // 총 개수 표시 영역

  // 테이블 tbody가 존재하지 않으면 렌더링 중단
  if (!tbody) return;

  // 사용자의 입력/선택 값 추출 (소문자 변환으로 대소문자 무시 검색 지원)
  const search    = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const statusF   = statusFilter ? statusFilter.value : '';
  const depth1F   = depth1Filter ? depth1Filter.value : '';

  // 이전 테이블 내용 초기화
  tbody.innerHTML = '';

  // [단계 1] 검색어 및 필터 조건에 따른 데이터 필터링
  let items = getItems().filter(item => {
    // 모든 주요 텍스트 컬럼을 하나의 문자열로 합쳐 전체 검색 대상 문자열 생성
    const allText = [
      item.depth1, item.depth2, item.depth3, item.depth4, item.depth5,
      item.url, item.status, item.completedDate, item.note
    ].join(' ').toLowerCase();

    // 1) 검색어 일치 여부 (검색어가 없으면 무조건 true)
    const matchSearch = !search || allText.includes(search);
    // 2) 상태 필터 일치 여부 (선택되지 않았으면 무조건 true)
    const matchStatus = !statusF || item.status === statusF;
    // 3) 1depth 필터 일치 여부 (선택되지 않았으면 무조건 true)
    const matchDepth1 = !depth1F || item.depth1 === depth1F;

    return matchSearch && matchStatus && matchDepth1;
  });

  // [단계 2] 컬럼 정렬 적용
  if (sortCol) {
    items = [...items].sort((a, b) => {
      // null이나 undefined 방어를 위해 String 변환 및 소문자 정규화
      const va = String(a[sortCol] || '').toLowerCase();
      const vb = String(b[sortCol] || '').toLowerCase();

      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ?  1 : -1;
      return 0;
    });
  }

  // [단계 3] 결과가 0건일 때의 비어있는 상태(Empty State) 화면 처리
  if (items.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = `<td colspan="10">🔍 검색 결과가 없습니다.</td>`;
    tbody.appendChild(tr);

    if (totalCount) {
      totalCount.textContent = '0개 항목';
    }
    return;
  }

  // [단계 4] 각 데이터 항목을 테이블 행(<tr>)으로 생성
  items.forEach((item, idx) => {
    const tr = document.createElement('tr');

    // 4-1. 파일 링크(URL) 처리: 외부 URL(http/https)과 로컬 파일 링크 구분
    let linkHtml = `<span class="dash">—</span>`;
    if (item.url) {
      const isExternal = typeof item.url === 'string' && (item.url.startsWith('http://') || item.url.startsWith('https://'));
      let label = '';

      if (isExternal) {
        // 외부 링크의 경우 도메인 호스트명 추출 (구형 브라우저 및 파싱 실패 대비 try-catch)
        try {
          label = '🔗 ' + new URL(item.url).hostname;
        } catch (e) {
          label = '🔗 ' + item.url;
        }
      } else {
        // 로컬 경로의 경우 파일명만 추출
        label = '📄 ' + (item.url.split('/').pop() || item.url);
      }

      linkHtml = `<a class="file-link" href="${item.url}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''} title="${item.url}">${label}</a>`;
    }

    // 4-2. 진행상태 배지(Status Badge) 스타일링
    const statusHtml = item.status
      ? `<span class="status status-${item.status}">${item.status}</span>`
      : `<span class="dash">—</span>`;

    // 4-3. 일반 셀 생성 헬퍼 함수 (값이 비어있을 경우 대시 '—' 기호 표시)
    const cell = (val, cls = '') =>
      `<td class="${cls}">${val || '<span class="dash">—</span>'}</td>`;

    // 4-4. 행 내부 HTML 구성 (총 10개 컬럼)
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

  // [단계 5] 상단 총 항목 수 업데이트
  if (totalCount) {
    totalCount.textContent = `총 ${items.length}개 항목`;
  }
}


// ==============================================================================
// 5. 정렬 이벤트 초기화 (Init Sorting Events)
// ==============================================================================

/**
 * 테이블 헤더(<th data-col="...">) 클릭 시 정렬 기준을 변경하고 재렌더링하는 이벤트 등록 함수.
 * 
 * 동작 과정:
 * 1. data-col 속성을 가진 모든 <th> 태그에 클릭 리스너 등록
 * 2. 동일 컬럼 재클릭 시 오름차순/내림차순 토글 (sortAsc 반전)
 * 3. 다른 컬럼 클릭 시 해당 컬럼으로 변경 및 오름차순 기본 설정
 * 4. 활성화된 정렬 헤더에 .sorted 클래스 및 방향 화살표(↑, ↓) 아이콘 갱신
 * 5. render() 호출하여 정렬된 결과 화면 반영
 */
function initSort() {
  document.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;

      if (sortCol === col) {
        // 이미 선택된 컬럼을 다시 클릭하면 정렬 방향만 반전
        sortAsc = !sortAsc;
      } else {
        // 새로운 컬럼을 클릭하면 해당 컬럼으로 변경하고 오름차순으로 초기화
        sortCol = col;
        sortAsc = true;
      }

      // 기존 th 요소들의 sorted 하이라이트 클래스 제거
      document.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
      th.classList.add('sorted');

      // 정렬 방향 화살표 아이콘 업데이트
      const icon = th.querySelector('.sort-icon');
      if (icon) {
        icon.textContent = sortAsc ? '↑' : '↓';
      }

      // 정렬된 상태로 테이블 다시 그리기
      render();
    });
  });
}


// ==============================================================================
// 6. 사용자 입력 이벤트 초기화 (Init Input/Filter Events)
// ==============================================================================

/**
 * 검색창 키 입력 및 필터 셀렉트박스 변경 이벤트를 바인딩하는 함수.
 * 
 * - 검색창(input#search):
 *   키보드를 누를 때마다 매번 렌더링하면 성능이 저하될 수 있으므로,
 *   180ms의 디바운스(Debounce) 타이머를 적용하여 입력이 멈춘 후 한 번만 렌더링합니다.
 * - 필터 셀렉트박스:
 *   'change' 이벤트 발생 시 즉시 render()를 호출하여 변경사항을 반영합니다.
 */
function initEvents() {
  let debounce; // 디바운스 타이머 ID를 보관하는 클로저 변수

  // 1) 검색어 입력창 이벤트
  const searchEl = document.getElementById('search');
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(render, 180);
    });
  }

  // 2) 진행상태 필터 드롭다운 이벤트
  const statusEl = document.getElementById('status-filter');
  if (statusEl) {
    statusEl.addEventListener('change', render);
  }

  // 3) 1depth 필터 드롭다운 이벤트
  const depth1El = document.getElementById('depth1-filter');
  if (depth1El) {
    depth1El.addEventListener('change', render);
  }
}


// ==============================================================================
// 7. 전체 페이지 초기화 (Init Application)
// ==============================================================================

/**
 * 애플리케이션 시작점(Entry Point).
 * 
 * 페이지 로드 시 필요한 기본 UI 텍스트 설정 및 각 모듈을 초기화합니다.
 * 1. 페이지 제목 및 푸터의 마지막 업데이트 날짜 출력
 * 2. 1depth 필터 옵션 생성 (populateFilters)
 * 3. 정렬 이벤트 바인딩 (initSort)
 * 4. 검색/필터 이벤트 바인딩 (initEvents)
 * 5. 최초 1회 테이블 렌더링 (render)
 */
function init() {
  // 페이지 제목 설정
  const pageTitle = document.getElementById('page-title');
  if (pageTitle && typeof INDEX_DATA !== 'undefined' && INDEX_DATA.title) {
    pageTitle.textContent = INDEX_DATA.title;
  }

  // 푸터 업데이트 날짜 출력 (현재 날짜 기준 로케일 포맷팅)
  const footer = document.getElementById('footer');
  if (footer) {
    footer.textContent = `마지막 업데이트: ${new Date().toLocaleDateString('ko-KR')}`;
  }

  // 각 초기화 함수 순차 호출
  populateFilters();
  initSort();
  initEvents();
  render();
}


// ==============================================================================
// 8. 안전한 DOM 로드 타이밍 감지 및 실행 (DOMContentLoaded Guard)
// ==============================================================================

/**
 * 스크립트 실행 시점에 DOM 요소가 아직 생성되지 않은 상태일 경우 발생하는 에러 방지.
 * - 이미 DOM 트리가 파싱 완료되었으면 즉시 init() 실행
 * - 아직 로딩 중이라면 DOMContentLoaded 이벤트 발생 시점에 init() 실행
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
