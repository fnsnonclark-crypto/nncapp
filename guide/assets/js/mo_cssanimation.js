/**
 * 모바일 기본 애니메이션 데모 - 메인 스크립트
 * 
 * 본 스크립트는 sticky 상단 애니메이션 플레이그라운드 프리뷰 제어와
 * 16가지 카테고리의 80여 개 CSS 애니메이션에 대한 동적 클래스 매핑 및
 * 속도/딜레이/무한 루프 실시간 세팅 연동 로직을 제어합니다.
 */

document.addEventListener('DOMContentLoaded', function () {
    const previewObject = document.getElementById('preview-box');
    const toast = document.getElementById('toast-popup');
    let toastTimeout;

    // 실시간 세팅 컨트롤 요소
    const speedSelect = document.getElementById('ani-speed');
    const delaySelect = document.getElementById('ani-delay');
    const infiniteCheckbox = document.getElementById('ani-infinite');

    let currentAnimation = 'bounce'; // 기본 재생 애니메이션

    // 공통 토스트 알림 제어
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
    // 1. 애니메이션 트리거 및 실시간 컨트롤 연동 함수
    // -------------------------------------------------------------
    function playAnimation(aniName) {
        if (!previewObject) return;

        currentAnimation = aniName;

        // 1) 기존 모든 animate.css 관련 클래스 초기화
        previewObject.className = 'preview-object';

        // 2) 속도(Duration) 값 연동
        const duration = speedSelect ? speedSelect.value : '1s';
        previewObject.style.setProperty('--animate-duration', duration);

        // 3) 딜레이(Delay) 값 연동
        const delay = delaySelect ? delaySelect.value : '0s';
        previewObject.style.animationDelay = delay;

        // 4) 무한 루프(Infinite Loop) 여부 연동
        const isInfinite = infiniteCheckbox ? infiniteCheckbox.checked : false;

        // 5) 브라우저 Reflow 강제 유발 (애니메이션 처음부터 다시 재생)
        void previewObject.offsetWidth;

        // 6) 동적 애니메이션 클래스 주입
        previewObject.classList.add('animate__animated');
        previewObject.classList.add(`animate__${aniName}`);

        if (isInfinite) {
            previewObject.classList.add('animate__infinite');
        }

        showToast(`[${aniName}] 애니메이션을 재생했습니다.`);
    }

    // -------------------------------------------------------------
    // 2. 애니메이션 제어 컨트롤러 이벤트 바인딩
    // -------------------------------------------------------------
    if (speedSelect) {
        speedSelect.addEventListener('change', () => playAnimation(currentAnimation));
    }
    if (delaySelect) {
        delaySelect.addEventListener('change', () => playAnimation(currentAnimation));
    }
    if (infiniteCheckbox) {
        infiniteCheckbox.addEventListener('change', () => playAnimation(currentAnimation));
    }

    // -------------------------------------------------------------
    // 3. 개별 애니메이션 칩 클릭 이벤트 바인딩
    // -------------------------------------------------------------
    const animationChips = document.querySelectorAll('.animation-chip');
    animationChips.forEach(chip => {
        chip.addEventListener('click', function () {
            const aniName = chip.getAttribute('data-ani');
            
            // 모든 칩의 활성화 상태 해제 후 현재 클릭 칩 활성화
            animationChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // 애니메이션 재생
            playAnimation(aniName);
        });
    });

    // -------------------------------------------------------------
    // 4. 카테고리 아코디언 접기/펼치기 제어 (Collapsible Category Panels)
    // -------------------------------------------------------------
    const categoryHeaders = document.querySelectorAll('.category-header');
    categoryHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const body = header.nextElementSibling;
            const isActive = header.classList.contains('active');
            
            // 아코디언 단일 개폐 모델 (현재 활성화된 패널 닫기)
            categoryHeaders.forEach(h => {
                h.classList.remove('active');
                h.nextElementSibling.style.maxHeight = '0px';
            });
            
            if (!isActive) {
                header.classList.add('active');
                body.style.maxHeight = body.scrollHeight + 'px';
                
                // 해당 카테고리가 처음 열릴 때 첫 번째 애니메이션 칩 재생
                const firstChip = body.querySelector('.animation-chip');
                if (firstChip) {
                    firstChip.click();
                }
            }
        });
    });

    // -------------------------------------------------------------
    // 5. 소스 자세히 보기 - 아코디언 토글 제어 및 비동기 JSON 로드
    // -------------------------------------------------------------
    const sourceToggleBtns = document.querySelectorAll('.source-toggle-btn');
    sourceToggleBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation(); // 부모 카테고리 클릭 전파 방지
            
            const targetId = btn.getAttribute('data-target');
            const targetWrapper = document.getElementById(targetId);
            const sourceUrl = btn.getAttribute('data-source');
            const codeElement = targetWrapper.querySelector('code');
            
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                targetWrapper.style.maxHeight = '0px';
                
                // 아코디언 전체 패널 높이 재계산 대응
                setTimeout(recalculateParentHeight, 350);
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
                        const formattedCode = `<!-- HTML -->\n${data.html}\n\n<!-- CSS Keyframe Trigger -->\n${data.css}\n\n<!-- JS Trigger Logic -->\n${data.js}`;
                        codeElement.innerText = formattedCode;
                        codeElement.setAttribute('data-loaded', 'true');
                        
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                        setTimeout(recalculateParentHeight, 50);
                    })
                    .catch(err => {
                        codeElement.innerText = '로딩 실패: ' + err.message + '\n\n[도움말] 브라우저 보안 규정상 로컬 탐색기(file://)가 아닌 로컬 웹 서버(예: Live Server 등) 환경에서 실행해야 외부 JSON 데이터 로드가 작동합니다.';
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                        setTimeout(recalculateParentHeight, 50);
                    });
            } else {
                btn.classList.add('active');
                targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                setTimeout(recalculateParentHeight, 50);
            }
        });
    });

    // 부모 카테고리 아코디언 패널의 스크롤 높이 값 동적 갱신
    function recalculateParentHeight() {
        const activeHeader = document.querySelector('.category-header.active');
        if (activeHeader) {
            const body = activeHeader.nextElementSibling;
            body.style.maxHeight = body.scrollHeight + 'px';
        }
    }

    // -------------------------------------------------------------
    // 6. 소스 코드 - 원클릭 클립보드 복사 로직
    // -------------------------------------------------------------
    const copyBtns = document.querySelectorAll('.copy-code-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            
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

    // 최초 실행 시 기본 애니메이션 재생
    playAnimation('bounce');
});
