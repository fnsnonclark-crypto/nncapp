/**
 * 모바일 템플릿 B01 스니펫 프레임 - 메인 스크립트
 * 
 * 본 스크립트는 가로 스크롤 카테고리 탭 항목 선택 상태 토글,
 * 카테고리별 상세 담보 내역 동적 렌더링, 
 * 그리고 소스 코드 비동기 fetch 및 클립보드 복사 기능을 제공합니다.
 */

document.addEventListener('DOMContentLoaded', function () {
    const toast = document.getElementById('toast-popup');
    let toastTimeout;

    // 공통 토스트 알림 함수
    function showToast(message) {
        if (!toast) return;
        toast.querySelector('.toast-text').innerText = message;
        clearTimeout(toastTimeout);
        toast.classList.add('show');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // -------------------------------------------------------------
    // 1. 카테고리별 상세 담보 내역 데이터셋 정의
    // -------------------------------------------------------------
    const coverageData = {
        "사망/후유": [
            { title: "일반상해사망", limit: "10,000", premium: "6,800" },
            { title: "질병사망 (특약)", limit: "5,000", premium: "12,400" },
            { title: "상해80%이상후유장해", limit: "5,000", premium: "1,450" }
        ],
        "인기/신담보": [
            { title: "상해수술비 (인기)", limit: "150", premium: "1,890" },
            { title: "골절진단비 (신규)", limit: "50", premium: "980" }
        ],
        "암": [
            { title: "암진단및치료비[암진단비(유사암제외)]", limit: "1,000", premium: "9,930" },
            { title: "암진단및치료비[암 통합치료비(비급여(전액부담 포함))", limit: "4,000", premium: "1,433" },
            { title: "통합암진단비(전이포함)(유사암제외)(특성소화기암(전이포함)진단비)", limit: "2,000", premium: "8,480" },
            { title: "통합암진단비(전이포함)(유사암제외)(10대특정암(전이포함)진단비)", limit: "2,000", premium: "2,460" },
            { title: "암수술비(유사암제외)", limit: "200", premium: "2,148" }
        ],
        "뇌혈관": [
            { title: "뇌혈관질환진단비", limit: "2,000", premium: "4,890" },
            { title: "뇌졸중진단비", limit: "2,000", premium: "2,130" },
            { title: "뇌출혈진단비", limit: "3,000", premium: "1,280" }
        ],
        "심장질환": [
            { title: "허혈성심장질환진단비", limit: "2,000", premium: "3,890" },
            { title: "급성심근경색증진단비", limit: "3,000", premium: "1,840" },
            { title: "심장판막수술비", limit: "1,000", premium: "950" }
        ]
    };

    // -------------------------------------------------------------
    // 2. 카테고리 탭 클릭 상태 제어 및 내역 렌더링 인터랙션
    // -------------------------------------------------------------
    const tabContainer = document.querySelector('.category-tab-container-snippet');
    const detailsContainer = document.getElementById('coverage-details-container');

    // 담보 내역 동적 렌더링 함수 (단일 카드 내 항목 및 구분선 연동)
    function renderCoverage(category) {
        if (!detailsContainer || !coverageData[category]) return;

        // 컨테이너 초기화
        detailsContainer.innerHTML = '';
        
        // 페이드 인 애니메이션 트리거를 위해 클래스 일시 제거 후 리플로우
        detailsContainer.classList.remove('coverage-detail-card');
        detailsContainer.offsetHeight; // force reflow
        detailsContainer.classList.add('coverage-detail-card');

        const items = coverageData[category];
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'coverage-detail-item';
            itemElement.style.animationDelay = `${index * 0.05}s`;

            itemElement.innerHTML = `
                <div class="coverage-item-title-group">
                    <div class="coverage-item-title">${item.title}</div>
                </div>
                <div class="coverage-item-values-row">
                    <div class="coverage-value-col">
                        <div class="coverage-value-label">가능금액(만원)</div>
                        <div class="coverage-value-amount">${item.limit}</div>
                    </div>
                    <div class="coverage-value-col">
                        <div class="coverage-value-label">보험료(원)</div>
                        <div class="coverage-value-amount">${item.premium}</div>
                    </div>
                </div>
            `;

            detailsContainer.appendChild(itemElement);

            // 마지막 항목이 아니면 가로 분할선 추가
            if (index < items.length - 1) {
                const divider = document.createElement('div');
                divider.className = 'coverage-divider';
                detailsContainer.appendChild(divider);
            }
        });
    }

    if (tabContainer) {
        const tabs = tabContainer.querySelectorAll(':scope > div');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                // 모든 탭의 스타일 초기화 (비활성 상태로 전환)
                tabs.forEach(t => {
                    t.style.background = '#F6F6F6';
                    const textDiv = t.querySelector('div');
                    if (textDiv) {
                        textDiv.style.color = '#777777';
                        textDiv.style.fontWeight = '500';
                    }
                });

                // 클릭한 탭의 스타일 적용 (활성 상태로 전환)
                tab.style.background = '#333333';
                const activeTextDiv = tab.querySelector('div');
                if (activeTextDiv) {
                    activeTextDiv.style.color = 'white';
                    activeTextDiv.style.fontWeight = '700';
                    
                    const categoryName = activeTextDiv.innerText.trim();
                    showToast(`[${categoryName}] 카테고리가 선택되었습니다.`);
                    
                    // 내역 동적 렌더링 호출
                    renderCoverage(categoryName);
                }
            });
        });
    }

    // 초기 상태로 암(Cancer) 카테고리 로딩
    renderCoverage("암");

    // -------------------------------------------------------------
    // 3. 소스 자세히 보기 - 아코디언 토글 제어 및 비동기 JSON 로드
    // -------------------------------------------------------------
    const sourceToggleBtns = document.querySelectorAll('.source-toggle-btn');
    sourceToggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = btn.getAttribute('data-target');
            const targetWrapper = document.getElementById(targetId);
            const sourceUrl = btn.getAttribute('data-source');
            const codeElement = targetWrapper.querySelector('code');
            const isCss = btn.classList.contains('css-toggle-btn');
            const dataKey = btn.getAttribute('data-key') || (isCss ? 'css' : 'html');
            
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                targetWrapper.style.maxHeight = '0px';
                return;
            }
            
            if (sourceUrl && codeElement && !codeElement.getAttribute('data-loaded')) {
                codeElement.innerText = '소스를 로딩하는 중입니다...';
                targetWrapper.style.maxHeight = '65px';
                btn.classList.add('active');
                
                fetch(sourceUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('CORS 정책에 의해 서버 환경(HTTP)이 아닐 경우 보안 문제로 JSON을 로드할 수 없습니다.');
                        }
                        return response.json();
                    })
                    .then(data => {
                        let formattedCode = '';
                        if (isCss) {
                            formattedCode = `/* CSS */\n${data.css}`;
                        } else {
                            const label = dataKey.toUpperCase();
                            formattedCode = `<!-- ${label} -->\n${data[dataKey] || data.html}`;
                        }
                        codeElement.innerText = formattedCode;
                        codeElement.setAttribute('data-loaded', 'true');
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                    })
                    .catch(err => {
                        codeElement.innerText = '로딩 실패: ' + err.message + '\n\n[도움말] 브라우저 보안 규정상 로컬 탐색기(file://)가 아닌 로컬 웹 서버(예: npx live-server, VS Code Live Server 등) 환경에서 실행해야 외부 JSON 데이터 로드가 작동합니다.';
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                    });
            } else {
                btn.classList.add('active');
                targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
            }
        });
    });

    // -------------------------------------------------------------
    // 4. 소스 코드 - 원클릭 클립보드 복사 로직
    // -------------------------------------------------------------
    const copyBtns = document.querySelectorAll('.copy-code-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = btn.getAttribute('data-clipboard');
            const targetCodeElement = document.getElementById(targetId).querySelector('code');
            
            if (targetCodeElement) {
                if (!targetCodeElement.getAttribute('data-loaded')) {
                    alert('소스가 먼저 로드된 상태에서 복사할 수 있습니다.');
                    return;
                }

                const textToCopy = targetCodeElement.innerText;
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    btn.innerText = 'Copied!';
                    btn.classList.add('copied');
                    
                    setTimeout(() => {
                        btn.innerText = 'Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy code: ', err);
                });
            }
        });
    });

    // -------------------------------------------------------------
    // 5. 플랜 비교 카드 선택 토글 로직
    // -------------------------------------------------------------
    window.togglePlan = function (element) {
        if (!element) return;
        
        const container = element.closest('.plan-cards-row');
        if (!container) return;
        
        const siblingPlans = container.querySelectorAll('.plan-card');
        siblingPlans.forEach(plan => {
            plan.classList.remove('active-plan');
        });
        
        element.classList.add('active-plan');
        
        const planName = element.querySelector('.plan-name').innerText;
        showToast(`플랜이 변경되었습니다: ${planName}`);
    };
});
