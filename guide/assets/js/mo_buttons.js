/**
 * 모바일 기본 버튼 모음 - 메인 스크립트
 * 
 * 본 스크립트는 여러 유형의 버튼들의 인터랙티브 클릭 반응 및
 * '소스 자세히 보기' 비동기 로드 및 복사 기능을 제어합니다.
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
    // 1. 버튼 클릭 이벤트 바인딩
    // -------------------------------------------------------------
    const btnStyle1 = document.querySelector('.btn-style-1');
    if (btnStyle1) {
        btnStyle1.addEventListener('click', function () {
            showToast('보장분석 반영 버튼이 활성화되었습니다.');
        });
    }

    // Type 02 버튼 이벤트 바인딩
    const btnSec = document.querySelector('.btn-style-2.btn-secondary');
    const btnPri = document.querySelector('.btn-style-2.btn-primary');
    
    if (btnSec) {
        btnSec.addEventListener('click', function () {
            showToast('단순설계 모드가 로드되었습니다.');
        });
    }
    if (btnPri) {
        btnPri.addEventListener('click', function () {
            showToast('상세설계 화면으로 이동합니다.');
        });
    }

    // -------------------------------------------------------------
    // 2. 소스 자세히 보기 - 아코디언 토글 제어 및 비동기 JSON 로드
    // -------------------------------------------------------------
    const sourceToggleBtns = document.querySelectorAll('.source-toggle-btn');
    sourceToggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = btn.getAttribute('data-target');
            const targetWrapper = document.getElementById(targetId);
            const sourceUrl = btn.getAttribute('data-source');
            const codeElement = targetWrapper.querySelector('code');
            const isCss = btn.classList.contains('css-toggle-btn');
            
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
                        let formattedCode = '';
                        if (isCss) {
                            formattedCode = `/* CSS Button Styling */\n${data.css}`;
                        } else {
                            formattedCode = `<!-- HTML Button Layout -->\n${data.html}`;
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
    // 3. 소스 코드 - 원클릭 클립보드 복사 로직
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
