/**
 * 모바일 기본 폴딩 - 메인 스크립트
 * 
 * 본 스크립트는 아코디언 FAQ FAQ, 요약글 더보기 카드, 플로팅 FAB 팬 아웃 메뉴, 접이식 검색 필터의
 * 인터랙티브 동작을 정의하고, '소스 자세히 보기' 비동기 아코디언 및 복사 복사 기능을 제어합니다.
 */

document.addEventListener('DOMContentLoaded', function () {
    const toast = document.getElementById('toast-popup');
    let toastTimeout;

    // 공통 토스트 알림 제어 함수
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
    // 1. 클래식 아코디언 (Classic FAQ Accordion) 제어
    // -------------------------------------------------------------
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const body = header.nextElementSibling;
            const isActive = header.classList.contains('active');
            
            // 다른 활성화되어 있는 모든 아코디언 패널들을 닫음 (단일 개폐 모델)
            accordionHeaders.forEach(h => {
                h.classList.remove('active');
                h.nextElementSibling.style.maxHeight = '0px';
            });
            
            // 현재 클릭한 패널이 닫혀있던 상태였다면 엶
            if (!isActive) {
                header.classList.add('active');
                body.style.maxHeight = body.scrollHeight + 'px';
                showToast('상세 답변 패널이 아코디언 전개되었습니다.');
            }
        });
    });

    // -------------------------------------------------------------
    // 2. 더보기 확장 카드 (Expanding Card) 제어
    // -------------------------------------------------------------
    const expandBtns = document.querySelectorAll('.btn-card-expand');
    
    expandBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = btn.getAttribute('data-target');
            const target = document.getElementById(targetId);
            const isExpanded = btn.classList.contains('expanded');
            
            if (isExpanded) {
                // 이미 확장되어 있는 상태이면 닫음
                btn.classList.remove('expanded');
                btn.innerText = '리뷰 원문 더보기';
                target.style.maxHeight = '0px';
                showToast('상세 리뷰 패널을 접었습니다.');
            } else {
                // 요약된 패널을 확장하여 펼침
                btn.classList.add('expanded');
                btn.innerText = '원문 접기';
                target.style.maxHeight = target.scrollHeight + 'px';
                showToast('상세 리뷰 전체를 확장 로드했습니다.');
            }
        });
    });

    // -------------------------------------------------------------
    // 3. 플로팅 버튼 네비게이션 폴딩 (FAB Menu Fan-out) 제어
    // -------------------------------------------------------------
    const fabTrigger = document.getElementById('fab-trigger');
    const fabMenu = document.getElementById('fab-menu');
    const fabItems = document.querySelectorAll('.fab-item');

    if (fabTrigger && fabMenu) {
        // 메인 '+' 버튼 클릭 시 서브 메뉴들이 딜레이를 가지고 방사형 등장
        fabTrigger.addEventListener('click', function () {
            const isActive = fabTrigger.classList.contains('active');
            
            fabTrigger.classList.toggle('active');
            fabMenu.classList.toggle('active');
            
            showToast(isActive ? '플로팅 서브 메뉴가 폴딩되었습니다.' : '플로팅 메뉴가 방사형으로 전개되었습니다.');
        });

        // 서브 메뉴 클릭 시 알림 반응
        fabItems.forEach((item, index) => {
            item.addEventListener('click', function () {
                showToast(`플로팅 단축 단축 메뉴 ${index + 1}번이 실행되었습니다.`);
                // 메뉴 닫기
                fabTrigger.classList.remove('active');
                fabMenu.classList.remove('active');
            });
        });
    }

    // -------------------------------------------------------------
    // 4. 상세 검색 접이식 필터 (Collapsible Filter Panel) 제어
    // -------------------------------------------------------------
    const filterTrigger = document.getElementById('filter-trigger');
    const filterPanel = document.getElementById('filter-panel');
    const filterTags = document.querySelectorAll('.filter-tag');

    if (filterTrigger && filterPanel) {
        filterTrigger.addEventListener('click', function () {
            const isOpen = filterTrigger.classList.contains('active');
            
            if (isOpen) {
                // 필터 그리드 접기
                filterTrigger.classList.remove('active');
                filterPanel.style.maxHeight = '0px';
                showToast('상세 필터 검색창을 닫았습니다.');
            } else {
                // 필터 그리드 엶
                filterTrigger.classList.add('active');
                filterPanel.style.maxHeight = filterPanel.scrollHeight + 'px';
                showToast('상세 필터 조건 패널이 펼쳐졌습니다.');
            }
        });
    }

    // 필터 상세 태그 개별 토글 선택 이벤트
    filterTags.forEach(tag => {
        tag.addEventListener('click', function () {
            tag.classList.toggle('selected');
            const tagName = tag.innerText;
            const isSel = tag.classList.contains('selected');
            showToast(`[${tagName}] 필터 조건이 ${isSel ? '지정' : '해제'}되었습니다.`);
            
            // 필터가 열린 상태에서 높이 재계산 (태그가 늘어나 줄바꿈될 경우 대응)
            if (filterPanel.style.maxHeight !== '0px') {
                filterPanel.style.maxHeight = filterPanel.scrollHeight + 'px';
            }
        });
    });

    // -------------------------------------------------------------
    // 4.5. 체크박스 전체 동의 폴딩 (Checkbox Select All Collapsible Terms) 제어
    // -------------------------------------------------------------
    const masterCheckbox = document.getElementById('terms-all-checkbox');
    const subCheckboxes = document.querySelectorAll('.sub-checkbox');
    const termsPanel = document.getElementById('terms-list-panel');
    const termDetailBtns = document.querySelectorAll('.term-detail-btn');

    if (masterCheckbox && termsPanel) {
        // 전체 체크박스 클릭 시 전체 선택/해제 및 폴딩 처리
        masterCheckbox.addEventListener('change', function () {
            const isChecked = masterCheckbox.checked;
            
            subCheckboxes.forEach(cb => {
                cb.checked = isChecked;
            });
            
            if (isChecked) {
                // 전체 체크 시 아코디언 접기
                termsPanel.style.maxHeight = '0px';
                showToast('모든 약관에 동의하여 약관 목록을 접었습니다.');
            } else {
                // 전체 체크 해제 시 아코디언 다시 열기
                termsPanel.style.maxHeight = termsPanel.scrollHeight + 'px';
                showToast('약관 동의를 해제하여 전체 목록을 펼쳤습니다.');
            }
        });

        // 서브 체크박스 개별 선택 시 마스터 체크박스 상태 제어 및 폴딩 처리
        subCheckboxes.forEach(cb => {
            cb.addEventListener('change', function () {
                const checkedCount = document.querySelectorAll('.sub-checkbox:checked').length;
                const isAllChecked = (checkedCount === subCheckboxes.length);
                
                const wasAllChecked = masterCheckbox.checked;
                masterCheckbox.checked = isAllChecked;
                
                if (isAllChecked && !wasAllChecked) {
                    // 개별 클릭으로 모두 동의가 완료되면 자동 접기
                    termsPanel.style.maxHeight = '0px';
                    showToast('모든 약관에 동의하여 약관 목록이 접혔습니다.');
                } else if (!isAllChecked && wasAllChecked) {
                    // 동의가 하나라도 해제되면 다시 목록 펼치기
                    termsPanel.style.maxHeight = termsPanel.scrollHeight + 'px';
                    showToast('일부 약관 동의가 해제되어 전체 목록이 펼쳐졌습니다.');
                } else {
                    showToast(`[${cb.getAttribute('data-name') || '항목'}] 동의가 ${cb.checked ? '지정' : '해제'}되었습니다.`);
                }
            });
        });

        // 각 개별 약관의 [보기] 세부 내용 펼치기 토글
        termDetailBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const targetId = btn.getAttribute('data-target');
                const detailContent = document.getElementById(targetId);
                const isActive = btn.classList.contains('active');
                
                if (isActive) {
                    btn.classList.remove('active');
                    detailContent.style.maxHeight = '0px';
                } else {
                    btn.classList.add('active');
                    detailContent.style.maxHeight = detailContent.scrollHeight + 'px';
                }
                
                // 세부 내용이 펼쳐지거나 접힐 때 부모 컨테이너(termsPanel)의 높이 값 동적 재조정
                setTimeout(() => {
                    if (termsPanel.style.maxHeight !== '0px') {
                        termsPanel.style.maxHeight = termsPanel.scrollHeight + 'px';
                    }
                }, 300);
            });
        });
    }

    // -------------------------------------------------------------
    // 5. 소스 자세히 보기 - 아코디언 토글 제어 및 비동기 JSON 로드
    // -------------------------------------------------------------
    const sourceToggleBtns = document.querySelectorAll('.source-toggle-btn');
    sourceToggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = btn.getAttribute('data-target');
            const targetWrapper = document.getElementById(targetId);
            const sourceUrl = btn.getAttribute('data-source');
            const codeElement = targetWrapper.querySelector('code');
            
            // 이미 열려 있는 상태라면 닫기
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                targetWrapper.style.maxHeight = '0px';
                return;
            }
            
            // 소스 주입 전 클릭 시 외부 JSON을 비동기 실시간 fetch 로드
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
                        // html과 js 필드를 합쳐서 예쁘게 구성
                        const formattedCode = `<!-- HTML -->\n${data.html}\n\n<!-- JS -->\n${data.js}`;
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
    // 6. 소스 코드 - 원클릭 클립보드 복사 로직
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
