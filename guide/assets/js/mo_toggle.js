/**
 * 모바일 기본 토글 버튼 - 메인 스크립트
 * 
 * 본 스크립트는 iOS 스위치, 다크모드 아이콘 스위치, 엘라스틱 젤리 토글, 슬라이드 잠금해제 버튼의
 * 인터랙티브 동작을 정의하고, '소스 자세히 보기' 비동기 아코디언 로직을 처리합니다.
 */

document.addEventListener('DOMContentLoaded', function () {
    const appContainer = document.querySelector('.app-container');
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
    // 1. iOS 스타일 스위치 제어
    // -------------------------------------------------------------
    const iosChk = document.getElementById('toggle-ios-chk');
    const iosText = document.getElementById('toggle-ios-text');

    if (iosChk && iosText) {
        iosChk.addEventListener('change', function (e) {
            if (e.target.checked) {
                iosText.innerText = 'ON';
                iosText.classList.add('active');
                showToast('iOS 푸시 알림 설정이 활성화되었습니다.');
            } else {
                iosText.innerText = 'OFF';
                iosText.classList.remove('active');
                showToast('iOS 푸시 알림 설정이 해제되었습니다.');
            }
        });
    }

    // -------------------------------------------------------------
    // 2. 테마 토글 (라이트/다크 모드 아이콘 스위치) 제어
    // -------------------------------------------------------------
    const themeChk = document.getElementById('toggle-theme-chk');
    const themeText = document.getElementById('toggle-theme-text');

    if (themeChk && themeText && appContainer) {
        themeChk.addEventListener('change', function (e) {
            if (e.target.checked) {
                appContainer.classList.add('dark-mode');
                themeText.innerText = '다크 모드';
                themeText.classList.add('active');
                showToast('시스템이 다크 모드로 전환되었습니다.');
            } else {
                appContainer.classList.remove('dark-mode');
                themeText.innerText = '라이트 모드';
                themeText.classList.remove('active');
                showToast('시스템이 라이트 모드로 전환되었습니다.');
            }
        });
    }

    // -------------------------------------------------------------
    // 3. 엘라스틱 젤리 토글 스위치 제어
    // -------------------------------------------------------------
    const jellyChk = document.getElementById('toggle-jelly-chk');
    const jellyText = document.getElementById('toggle-jelly-text');

    if (jellyChk && jellyText) {
        jellyChk.addEventListener('change', function (e) {
            if (e.target.checked) {
                jellyText.innerText = 'Active';
                jellyText.classList.add('active');
                showToast('엘라스틱 젤리 스위치가 활성화되었습니다.');
            } else {
                jellyText.innerText = 'Inactive';
                jellyText.classList.remove('active');
                showToast('엘라스틱 젤리 스위치가 비활성화되었습니다.');
            }
        });
    }

    // -------------------------------------------------------------
    // 4. Slide to Unlock confirmation (슬라이드 잠금해제 토글) 제어
    // -------------------------------------------------------------
    const handle = document.getElementById('unlock-handle');
    const track = document.getElementById('unlock-track');
    const label = document.getElementById('unlock-label');

    if (handle && track && label) {
        let isDragging = false;
        let startX = 0;
        let maxSlide = 0;
        let currentTranslate = 0;

        // 슬라이더 최대 이동 가능 너비 계산 (반응형 대응)
        const updateMaxSlide = () => {
            maxSlide = track.offsetWidth - handle.offsetWidth - 8; // 패딩 여백 4px씩 양쪽 8px 공제
        };
        
        // 페이지 로드 시 및 화면 크기 변화 시 최대 슬라이드 너비 갱신
        updateMaxSlide();
        window.addEventListener('resize', updateMaxSlide);

        // 드래그 시작 이벤트 핸들러
        const dragStart = (e) => {
            if (track.classList.contains('unlocked')) return;
            isDragging = true;
            // 마우스 클릭 및 모바일 터치 클라이언트 X좌표 취득
            startX = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
            handle.style.transition = 'none'; // 드래그 도중에는 딜레이 없는 즉시 이동을 위해 transition 해제
            track.style.cursor = 'grabbing';
        };

        // 드래그 이동 이벤트 핸들러
        const dragMove = (e) => {
            if (!isDragging) return;
            const currentX = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
            let diff = currentX - startX;

            // 가로 이동 한계치 0 ~ maxSlide 제어
            diff = Math.max(0, Math.min(diff, maxSlide));
            currentTranslate = diff;

            handle.style.transform = `translateX(${diff}px)`;
            // 이동량에 맞추어 글씨 투명도를 페이드 아웃시킴
            label.style.opacity = 1 - (diff / maxSlide);
        };

        // 드래그 마침 이벤트 핸들러
        const dragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            track.style.cursor = 'default';

            // 슬라이더 복귀 및 완료 처리를 위한 부드러운 트랜지션 복원
            handle.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease';

            // 92% 지점 이상 드래그 되었을 경우 잠금 해제 승인
            if (currentTranslate >= maxSlide * 0.92) {
                handle.style.transform = `translateX(${maxSlide}px)`;
                label.style.opacity = 0;
                track.classList.add('unlocked');
                label.innerText = '인증 완료';
                label.style.opacity = 1;
                showToast('슬라이드 밀기 인증에 성공했습니다.');

                // 2.5초 대기 후 다음 모의 클릭을 위해 원상 복구시키는 체험 설계 적용
                setTimeout(() => {
                    track.classList.remove('unlocked');
                    handle.style.transform = 'translateX(0px)';
                    label.innerText = '밀어서 잠금해제';
                    label.style.opacity = 1;
                    currentTranslate = 0;
                }, 2500);
            } else {
                // 드래그 충족 미달 시 원점 복구 (탄성 모션 복원)
                handle.style.transform = 'translateX(0px)';
                label.style.opacity = 1;
                currentTranslate = 0;
            }
        };

        // 마우스 리스너 등록
        handle.addEventListener('mousedown', dragStart);
        window.addEventListener('mousemove', dragMove);
        window.addEventListener('mouseup', dragEnd);

        // 모바일 터치 리스너 등록 (Touch devices)
        handle.addEventListener('touchstart', dragStart);
        window.addEventListener('touchmove', dragMove);
        window.addEventListener('touchend', dragEnd);
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
            const isCss = btn.classList.contains('css-toggle-btn');
            
            // 이미 펼쳐져 활성화된 패널이면 닫기 동작 수행
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
                            formattedCode = `<!-- HTML -->\n${data.html}\n\n<!-- JS -->\n${data.js}`;
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
