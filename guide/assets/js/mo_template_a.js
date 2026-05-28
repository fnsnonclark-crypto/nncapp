/**
 * 모바일 템플릿 A타입 컨텐츠 - 메인 스크립트
 * 
 * 본 스크립트는 상세설계/단순설계 탭 전환 인터랙션과 함께
 * 소스 자세히 보기 및 CSS 자세히보기 아코디언 코드 서랍의 비동기 fetch 로직을 수행합니다.
 */

document.addEventListener('DOMContentLoaded', function () {
    const toast = document.getElementById('toast-popup');
    let toastTimeout;

    // 공통 토스트 피드백 함수
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
    // 1. 상세설계 / 단순설계 탭 전환 제어
    // -------------------------------------------------------------
    const tabItems = document.querySelectorAll('.tab-item');
    const progressFill = document.querySelector('.progress-bar-fill');
    const insuredDetails = document.querySelector('.insured-details-card');
    const quickActions = document.querySelector('.quick-action-group');
    const searchInput = document.querySelector('.search-input');

    tabItems.forEach(tab => {
        tab.addEventListener('click', function () {
            if (tab.classList.contains('active')) return;

            // 1) 탭 활성화 토글 및 언더라인 무브
            tabItems.forEach(t => {
                t.classList.remove('active');
                const line = t.querySelector('.tab-underline');
                if (line) line.remove(); // 기존 언더라인 제거
            });

            tab.classList.add('active');
            
            // 새 탭에 언더라인 동적 주입
            const underline = document.createElement('div');
            underline.className = 'tab-underline';
            tab.appendChild(underline);

            const tabType = tab.getAttribute('data-tab');

            // 2) 탭 타입에 따른 화면 변화 시뮬레이션
            if (tabType === 'simple') {
                // 단순설계 탭 선택 시
                showToast('단순설계 화면으로 전환되었습니다.');
                if (progressFill) progressFill.style.width = '50%'; // 2/4 진행도로 설정 변경
                
                // 단순설계 시에는 피보험자 상세 카드를 숨기고 안내 메시지로 변경하거나 간소화
                if (insuredDetails) {
                    insuredDetails.style.opacity = '0.5';
                    insuredDetails.style.pointerEvents = 'none';
                }
                if (quickActions) {
                    quickActions.style.display = 'none';
                }
                if (searchInput) {
                    searchInput.value = '단순설계 고객';
                }
            } else {
                // 상세설계 탭 선택 시
                showToast('상세설계 화면으로 전환되었습니다.');
                if (progressFill) progressFill.style.width = '25%'; // 1/4 진행도로 복원
                
                if (insuredDetails) {
                    insuredDetails.style.opacity = '1';
                    insuredDetails.style.pointerEvents = 'auto';
                }
                if (quickActions) {
                    quickActions.style.display = 'flex';
                }
                if (searchInput) {
                    searchInput.value = '홍길동';
                }
            }
        });
    });

    // -------------------------------------------------------------
    // 2. 대화형 버튼 클릭 바인딩
    // -------------------------------------------------------------
    // 신규고객등록 버튼
    const btnRegister = document.querySelector('.btn-register');
    if (btnRegister) {
        btnRegister.addEventListener('click', function () {
            showToast('신규 고객 등록 화면으로 이동합니다.');
        });
    }

    // 가입설계동의 버튼
    const btnConsent = document.querySelector('.btn-consent');
    if (btnConsent) {
        btnConsent.addEventListener('click', function () {
            showToast('가입설계 동의 SMS를 고객에게 전송했습니다.');
        });
    }

    // AI설계 시작하기 버튼
    const btnStart = document.querySelector('.btn-start-ai');
    if (btnStart) {
        btnStart.addEventListener('click', function () {
            showToast('AI설계 분석이 시작되었습니다. 잠시만 기다려주세요.');
        });
    }

    // 헤더 백버튼
    const navBack = document.querySelector('.nav-back-btn');
    if (navBack) {
        navBack.addEventListener('click', function () {
            showToast('이전 화면으로 돌아갑니다.');
        });
    }

    // 헤더 메뉴버튼
    const navMenu = document.querySelector('.nav-menu-btn');
    if (navMenu) {
        navMenu.addEventListener('click', function () {
            showToast('전체 메뉴 리스트를 호출합니다.');
        });
    }

    // 독립형 검색 필드 이벤트 바인딩
    const standaloneSearch = document.querySelector('.search-input-field.standalone');
    if (standaloneSearch) {
        const input = standaloneSearch.querySelector('.search-input');
        
        // 검색 필드 자체 클릭 포커싱 대응
        standaloneSearch.addEventListener('click', function () {
            input.focus();
        });

        // 엔터키 입력 시 검색 피드백
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                showToast(`"${input.value}" 고객을 성공적으로 검색하였습니다.`);
                input.blur();
            }
        });
    }

    // -------------------------------------------------------------
    // 3. 아이콘 쇼케이스 그리드 클릭 이벤트 바인딩
    // -------------------------------------------------------------
    const iconTiles = document.querySelectorAll('.icon-tile');
    iconTiles.forEach(tile => {
        tile.addEventListener('click', function () {
            const iconName = tile.getAttribute('data-icon');
            showToast(`[${iconName}.svg] 아이콘 에셋이 활성화되었습니다.`);
        });
    });

    // -------------------------------------------------------------
    // 4. 소스 자세히 보기 - 아코디언 토글 제어 및 비동기 JSON 로드
    // -------------------------------------------------------------
    const sourceToggleBtns = document.querySelectorAll('.source-toggle-btn');
    sourceToggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = btn.getAttribute('data-target');
            const targetWrapper = document.getElementById(targetId);
            const sourceUrl = btn.getAttribute('data-source');
            const codeElement = targetWrapper.querySelector('code');
            const isCss = btn.classList.contains('css-toggle-btn');
            
            // 이미 활성화된 패널이면 닫기 동작 수행
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                targetWrapper.style.maxHeight = '0px';
                return;
            }
            
            // 최초 클릭으로 데이터가 공백인 경우 외부 JSON 비동기 로딩
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
                            formattedCode = `<!-- HTML -->\n${data.html}`;
                        }
                        codeElement.innerText = formattedCode;
                        codeElement.setAttribute('data-loaded', 'true');
                        
                        // 실시간 scrollHeight를 재연산하여 아코디언 팽창 애니메이션 실행
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                    })
                    .catch(err => {
                        codeElement.innerText = '로딩 실패: ' + err.message + '\n\n[도움말] 브라우저 보안 규정상 로컬 탐색기(file://)가 아닌 로컬 웹 서버(예: npx live-server, VS Code Live Server, Python HTTP Server 등) 환경에서 실행해야 외부 JSON 데이터 로드가 작동합니다.';
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                    });
            } else {
                // 이미 로드 완료된 상태라면 단순히 개폐 토글만 활성화
                btn.classList.add('active');
                targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
            }
        });
    });

    // -------------------------------------------------------------
    // 5. 소스 코드 - 원클릭 클립보드 복사 로직
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
});
