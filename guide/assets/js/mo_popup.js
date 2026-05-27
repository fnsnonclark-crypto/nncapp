/**
 * 모바일 기본 팝업 데모 - 메인 스크립트
 * 
 * 본 스크립트는 모바일 기본 4대 팝업 패턴(전체 화면, 바텀 시트, 다이얼로그, 토스트)의
 * 열기/닫기 동작 및 각 애니메이션 타이밍 동기화를 처리합니다.
 * 추가적으로, '소스 자세히 보기' 아코디언 및 외부 JSON 파일 비동기 로딩(Copy 포함) 기능을 구현합니다.
 */

document.addEventListener('DOMContentLoaded', function () {
    // 배경 딤드 오버레이
    const backdrop = document.querySelector('.popup-backdrop');

    // 1. 전체 화면 팝업 관련 요소
    const btnFull = document.getElementById('trigger-full');
    const popupFull = document.querySelector('.popup-full');
    const closeFull = document.getElementById('close-full');
    const actionFull = document.getElementById('action-full');

    // 2. 바텀 시트 팝업 관련 요소
    const btnSheet = document.getElementById('trigger-sheet');
    const popupSheet = document.querySelector('.popup-sheet');
    const optionItems = document.querySelectorAll('.option-item');

    // 3. 얼럿 다이얼로그 관련 요소
    const btnDialog = document.getElementById('trigger-dialog');
    const popupDialog = document.querySelector('.popup-dialog');
    const btnDialogCancel = document.getElementById('dialog-cancel');
    const btnDialogConfirm = document.getElementById('dialog-confirm');

    // 4. 토스트 알림 관련 요소
    const btnToast = document.getElementById('trigger-toast');
    const toast = document.getElementById('toast-popup');
    let toastTimeout; // 토스트 디스미스용 타이머 변수

    // ==========================================================================
    // 공통 뒷배경 제어 함수
    // ==========================================================================
    function showBackdrop() {
        backdrop.classList.add('show');
    }

    function hideBackdrop() {
        backdrop.classList.remove('show');
    }

    // ==========================================================================
    // 1. 전체 화면 팝업 (Full-Screen Modal) 제어
    // ==========================================================================
    if (btnFull && popupFull) {
        btnFull.addEventListener('click', function () {
            popupFull.classList.add('show');
        });

        const closeFullPopup = () => {
            popupFull.classList.remove('show');
        };
        
        closeFull.addEventListener('click', closeFullPopup);
        actionFull.addEventListener('click', closeFullPopup);
    }

    // ==========================================================================
    // 2. 바텀 시트 팝업 (Bottom Sheet) 제어
    // ==========================================================================
    if (btnSheet && popupSheet) {
        btnSheet.addEventListener('click', function () {
            showBackdrop();
            popupSheet.classList.add('show');
        });

        optionItems.forEach(item => {
            item.addEventListener('click', function () {
                optionItems.forEach(opt => opt.classList.remove('selected'));
                item.classList.add('selected');
                
                const optionName = item.querySelector('.option-name').innerText;
                showToast(`"${optionName}" 옵션이 선택되었습니다.`);
                
                closeBottomSheet();
            });
        });

        function closeBottomSheet() {
            popupSheet.classList.remove('show');
            hideBackdrop();
        }

        backdrop.addEventListener('click', function () {
            if (popupSheet.classList.contains('show')) {
                closeBottomSheet();
            }
        });
    }

    // ==========================================================================
    // 3. 얼럿 다이얼로그 (Alert/Confirm Dialog) 제어
    // ==========================================================================
    if (btnDialog && popupDialog) {
        btnDialog.addEventListener('click', function () {
            showBackdrop();
            popupDialog.classList.add('show');
        });

        const closeDialog = () => {
            popupDialog.classList.remove('show');
            hideBackdrop();
        };

        btnDialogCancel.addEventListener('click', closeDialog);
        
        btnDialogConfirm.addEventListener('click', function () {
            closeDialog();
            showToast('성공적으로 삭제 처리되었습니다.');
        });

        backdrop.addEventListener('click', function () {
            if (popupDialog.classList.contains('show')) {
                closeDialog();
            }
        });
    }

    // ==========================================================================
    // 4. 토스트 알림 (Toast Notification) 제어
    // ==========================================================================
    function showToast(message) {
        if (!toast) return;

        toast.querySelector('.toast-text').innerText = message;
        clearTimeout(toastTimeout);
        toast.classList.add('show');
        
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    if (btnToast) {
        btnToast.addEventListener('click', function () {
            showToast('새로운 실시간 알림이 도착했습니다.');
        });
    }

    // ==========================================================================
    // 5. 소스 자세히 보기 - 아코디언 토글 제어 및 비동기 JSON 로드
    // ==========================================================================
    const sourceToggleBtns = document.querySelectorAll('.source-toggle-btn');
    sourceToggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = btn.getAttribute('data-target');
            const targetWrapper = document.getElementById(targetId);
            const sourceUrl = btn.getAttribute('data-source');
            const codeElement = targetWrapper.querySelector('code');
            
            // 이미 펼쳐져 활성화된 패널이면 닫기 동작 수행
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                targetWrapper.style.maxHeight = '0px';
                return;
            }
            
            // 아직 소스 코드가 주입되지 않은 최초 클릭 상태라면 비동기 fetch 호출
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
                        const formattedCode = `<!-- HTML -->\n${data.html}\n\n<!-- JS -->\n${data.js}`;
                        codeElement.innerText = formattedCode;
                        codeElement.setAttribute('data-loaded', 'true');
                        
                        // 부드러운 아코디언 확장 모션 실행
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                    })
                    .catch(err => {
                        codeElement.innerText = '로딩 실패: ' + err.message + '\n\n[도움말] 브라우저 보안 규정상 로컬 탐색기(file://)가 아닌 로컬 웹 서버(예: npx live-server, VS Code Live Server, Python HTTP Server 등) 환경에서 실행해야 외부 JSON 데이터 로드가 작동합니다.';
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                    });
            } else {
                // 이미 코드가 로드된 상태라면 단순히 개폐만 수행
                btn.classList.add('active');
                targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
            }
        });
    });

    // ==========================================================================
    // 6. 소스 코드 - 원클릭 클립보드 복사 로직
    // ==========================================================================
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
