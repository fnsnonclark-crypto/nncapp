/**
 * 모바일 템플릿 B타입 컨텐츠 - 메인 스크립트
 * 
 * 본 스크립트는 가입 테마 선택(판매인기/신담보, 3대 진단) 폴딩 및
 * 하위 담보 항목 간의 양방향 체크 상태 동기화, 아코디언 모션,
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
    // 1. 헤더 네비게이션 시뮬레이터 바인딩
    // -------------------------------------------------------------
    const navBack = document.querySelector('.nav-back-btn');
    if (navBack) {
        navBack.addEventListener('click', function () {
            showToast('이전 단계(1/4)로 돌아갑니다.');
        });
    }

    const navMenu = document.querySelector('.nav-menu-btn');
    if (navMenu) {
        navMenu.addEventListener('click', function () {
            showToast('전체 설계 메뉴를 호출합니다.');
        });
    }

    // -------------------------------------------------------------
    // 2. 가입설계 테마 및 하위 담보 상호작용 인터랙션
    // -------------------------------------------------------------
    const accordionItems = document.querySelectorAll('.theme-accordion-item');

    accordionItems.forEach(item => {
        const headerRow = item.querySelector('.theme-header-row');
        const themeCheckbox = item.querySelector('.theme-checkbox');
        const arrowBtn = item.querySelector('.theme-arrow-btn');
        const panelWrapper = item.querySelector('.sub-panel-wrapper');
        const subRows = item.querySelectorAll('.sub-item-row');

        // 2-1) 초기 상태 셋팅 (max-height 동적 계산을 위해)
        if (item.classList.contains('expanded') && panelWrapper) {
            // 브라우저 렌더링 후 height 계산
            setTimeout(() => {
                panelWrapper.style.maxHeight = panelWrapper.scrollHeight + 'px';
            }, 100);
        }

        // 2-2) 아코디언 펼침/접기 토글 함수
        function toggleExpand(e) {
            // 체크박스 자체를 누른 경우 펼침 동작을 타지 않고 체크박스 로직으로 위임
            if (e.target.closest('.theme-checkbox-wrapper') || e.target.closest('.theme-checkbox')) {
                return;
            }

            const isExpanded = item.classList.contains('expanded');
            
            // 모든 아코디언을 닫지 않고 개별적으로 개폐되도록 설계 (다중 선택 가능 구조)
            if (isExpanded) {
                item.classList.remove('expanded');
                if (panelWrapper) {
                    // maxHeight가 none인 경우, 트랜지션 모션이 작동할 수 있도록 scrollHeight를 먼저 셋팅하고 reflow 유도
                    if (panelWrapper.style.maxHeight === 'none' || !panelWrapper.style.maxHeight) {
                        panelWrapper.style.maxHeight = panelWrapper.scrollHeight + 'px';
                        panelWrapper.offsetHeight; // 강제 리플로우(Reflow)
                    }
                    panelWrapper.style.maxHeight = '0px';
                }
            } else {
                item.classList.add('expanded');
                if (panelWrapper) {
                    panelWrapper.style.maxHeight = panelWrapper.scrollHeight + 'px';
                    // 애니메이션 완료 시점에 패널 내부 유연성 및 부모 소스 뷰어 반응형 대응을 위해 none 처리
                    setTimeout(() => {
                        if (item.classList.contains('expanded')) {
                            panelWrapper.style.maxHeight = 'none';
                        }
                    }, 400);
                }
            }
        }

        // 헤더 로우 클릭 시 펼침/접기 (화살표 버튼 클릭도 버블링을 통해 여기에 도달하므로 중복 이벤트 바인딩 해제)
        if (headerRow) headerRow.addEventListener('click', toggleExpand);

        // 2-3) 테마 메인 체크박스 제어 로직
        if (themeCheckbox) {
            themeCheckbox.addEventListener('click', function (e) {
                e.stopPropagation(); // 부모 펼침 이벤트 전파 방지
                
                const currentState = themeCheckbox.getAttribute('data-state');
                const newState = currentState === 'on' ? 'off' : 'on';
                
                updateThemeState(newState);

                // 메인 테마 체크 선택/해제에 따라 하위 모든 담보 상태 일괄 동기화
                subRows.forEach(subRow => {
                    const subCheckbox = subRow.querySelector('.theme-checkbox');
                    const subRadio = subRow.querySelector('.theme-radio');
                    
                    if (subCheckbox) {
                        subCheckbox.setAttribute('data-state', newState);
                        if (newState === 'on') {
                            subRow.classList.add('checked-row');
                        } else {
                            subRow.classList.remove('checked-row');
                        }
                    } else if (subRadio) {
                        if (newState === 'on') {
                            // 라디오 버튼의 경우 이미 켜진 게 없다면 3번째 항목('10~15만원')을 강제 활성화
                            const alreadyOn = Array.from(subRows).some(r => {
                                const rad = r.querySelector('.theme-radio');
                                return rad && rad.getAttribute('data-state') === 'on';
                            });
                            if (!alreadyOn) {
                                const thirdRadioRow = subRows[2]; // 10~15만원 (3번째 항목)
                                if (thirdRadioRow) {
                                    const rad = thirdRadioRow.querySelector('.theme-radio');
                                    if (rad) rad.setAttribute('data-state', 'on');
                                    thirdRadioRow.classList.add('checked-row');
                                }
                            }
                        } else {
                            // 전부 오프 처리
                            subRadio.setAttribute('data-state', 'off');
                            subRow.classList.remove('checked-row');
                        }
                    }
                });

                // 사용자 피드백 토스트
                const themeName = item.querySelector('.theme-title').innerText;
                if (newState === 'on') {
                    showToast(`[${themeName}] 테마가 활성화되었습니다.`);
                    // 선택 시 자동으로 아코디언도 활짝 열어주기
                    if (!item.classList.contains('expanded')) {
                        item.classList.add('expanded');
                        if (panelWrapper) {
                            panelWrapper.style.maxHeight = panelWrapper.scrollHeight + 'px';
                            setTimeout(() => {
                                if (item.classList.contains('expanded')) {
                                    panelWrapper.style.maxHeight = 'none';
                                }
                            }, 400);
                        }
                    }
                } else {
                    showToast(`[${themeName}] 테마 선택이 해제되었습니다.`);
                }
            });
        }

        // 2-4) 하위 담보 개별 체크박스/라디오 및 로우 바인딩
        subRows.forEach(subRow => {
            subRow.addEventListener('click', function () {
                const subCheckbox = subRow.querySelector('.theme-checkbox');
                const subRadio = subRow.querySelector('.theme-radio');

                if (subCheckbox) {
                    const currentState = subCheckbox.getAttribute('data-state');
                    const newState = currentState === 'on' ? 'off' : 'on';

                    subCheckbox.setAttribute('data-state', newState);
                    if (newState === 'on') {
                        subRow.classList.add('checked-row');
                        showToast(`담보 선택: ${subRow.querySelector('.sub-item-text').innerText}`);
                    } else {
                        subRow.classList.remove('checked-row');
                        showToast(`담보 해제: ${subRow.querySelector('.sub-item-text').innerText}`);
                    }
                } else if (subRadio) {
                    // 라디오 버튼이므로 이 테마 안의 모든 라디오 일괄 선택 해제
                    subRows.forEach(r => {
                        const otherRadio = r.querySelector('.theme-radio');
                        if (otherRadio) {
                            otherRadio.setAttribute('data-state', 'off');
                            r.classList.remove('checked-row');
                        }
                    });

                    subRadio.setAttribute('data-state', 'on');
                    subRow.classList.add('checked-row');
                    showToast(`보험료 선택: ${subRow.querySelector('.sub-item-text').innerText}`);
                }

                // 하위 담보 선택 상태 변화에 따라 부모 메인 테마 체크박스 동적 업데이트
                syncParentCheckbox();
            });
        });

        // 부모 테마 체크박스의 비주얼 및 활성 상태 클래스 업데이트
        function updateThemeState(state) {
            themeCheckbox.setAttribute('data-state', state);
            if (state === 'on') {
                item.classList.remove('inactive-theme');
                item.classList.add('active-theme');
            } else {
                item.classList.remove('active-theme');
                item.classList.add('inactive-theme');
            }
        }

        // 하위 리스트 상태를 읽어 부모 체크박스 동기화 (하나라도 켜져 있으면 부모 온, 모두 꺼져있으면 오프)
        function syncParentCheckbox() {
            let activeCount = 0;
            subRows.forEach(subRow => {
                const subCheckbox = subRow.querySelector('.theme-checkbox');
                const subRadio = subRow.querySelector('.theme-radio');
                if (subCheckbox && subCheckbox.getAttribute('data-state') === 'on') {
                    activeCount++;
                }
                if (subRadio && subRadio.getAttribute('data-state') === 'on') {
                    activeCount++;
                }
            });

            if (activeCount > 0) {
                updateThemeState('on');
            } else {
                updateThemeState('off');
            }
        }
    });

    // -------------------------------------------------------------
    // 3. 우측 하단 스티키 CTA 제출 시뮬레이터
    // -------------------------------------------------------------
    const btnSubmit = document.querySelector('.btn-theme-submit');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', function () {
            // 현재 선택된 총 담보 수 수집
            const checkedSubItems = document.querySelectorAll('.sub-item-row.checked-row');
            const selectedCount = checkedSubItems.length;

            if (selectedCount === 0) {
                showToast('가입을 희망하는 테마나 담보를 최소 1개 이상 선택해 주세요.');
            } else {
                showToast(`선택하신 ${selectedCount}개의 담보를 반영하여 맞춤형 AI설계를 준비합니다!`);
            }
        });
    }

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
                        codeElement.innerText = '로딩 실패: ' + err.message + '\n\n[도움말] 브라우저 보안 규정상 로컬 탐색기(file://)가 아닌 로컬 웹 서버(예: npx live-server, VS Code Live Server 등) 환경에서 실행해야 외부 JSON 데이터 로드가 작동합니다.';
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
