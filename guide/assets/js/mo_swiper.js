/**
 * 모바일 기본 스와이퍼 데모 - 메인 스크립트
 * 
 * 본 스크립트는 Swiper.js v11 API를 활용하여 4가지 타입의 모바일 스와이퍼를 초기화하고 제어합니다.
 * 추가적으로 오토플레이 제어용 토글 버튼 처리 및 코드 자세히 보기 아코디언, 클립보드 복사 기능을 수행합니다.
 * 특히 '소스 자세히 보기' 버튼 클릭 시, 해당하는 외부 JSON 파일(.json)을 비동기(fetch) 방식으로 실시간 로드하여 파싱합니다.
 */

document.addEventListener('DOMContentLoaded', function () {

    // -------------------------------------------------------------
    // 1. Swiper 1: 기본 내비게이션 스와이퍼 (기본 스와이프 모델)
    // -------------------------------------------------------------
    // - 가장 직관적이고 표준적인 슬라이더 형태입니다.
    // - 가로 방향 드래그 스와이프를 지원하며 페이징과 내비게이션 버튼을 탑재하고 있습니다.
    // -------------------------------------------------------------
    const swiper1 = new Swiper('.swiper-type-1', {
        // 슬라이드 진행 방향 (horizontal: 가로형, vertical: 세로형)
        direction: 'horizontal',
        
        // 무한 루프 활성화 여부 (false: 마지막 슬라이드에 다다르면 스와이프가 멈춤)
        loop: false,
        
        // 화면당 보여질 슬라이드 개수
        slidesPerView: 1,
        
        // 슬라이드 사이의 간격 (px 단위)
        spaceBetween: 20,
        
        // 인디케이터(페이징 닷) 설정
        pagination: {
            el: '.pagination-1',  // 페이징 닷이 렌더링될 DOM 클래스 지정
            clickable: true,       // 페이징 닷 클릭 시 해당 슬라이드로 즉시 이동 여부
        },
        
        // 좌우 컨트롤러(이전/다음 화살표) 설정
        navigation: {
            nextEl: '.btn-next-1', // 다음 버튼의 DOM 클래스 지정
            prevEl: '.btn-prev-1', // 이전 버튼의 DOM 클래스 지정
        },
    });


    // -------------------------------------------------------------
    // 2. Swiper 2: 오토 플레이 스와이퍼 (Autoplay 모델, 루프 없음)
    // -------------------------------------------------------------
    // - 일정 주기마다 자동으로 슬라이드가 전환되는 오토플레이형 슬라이더입니다.
    // - 재생/일시정지 토글 제어 바를 제공하며 루프는 비활성화(false)되어 있습니다.
    // - 사용자 드래그나 버튼 상호작용 시 오토플레이가 일시 정지 상태로 유지됩니다.
    // -------------------------------------------------------------
    const swiper2 = new Swiper('.swiper-type-2', {
        direction: 'horizontal',
        loop: false,
        slidesPerView: 1,
        spaceBetween: 20,
        
        // 자동 전환(오토플레이) 상세 설정
        autoplay: {
            delay: 3000,                  // 다음 슬라이드로 넘어갈 시간 간격 (3000ms = 3초)
            disableOnInteraction: true,   // 사용자 조작(드래그, 네비게이션 클릭 등) 감지 시 자동 재생을 즉시 정지
        },
        
        pagination: {
            el: '.pagination-2',
            clickable: true,
        },
        navigation: {
            nextEl: '.btn-next-2',
            prevEl: '.btn-prev-2',
        },
    });

    // Swiper 2의 오토플레이 제어 버튼(재생/일시정지) 동작 로직
    const toggleBtn2 = document.querySelector('.btn-toggle-2');
    if (toggleBtn2) {
        const pauseIcon = toggleBtn2.querySelector('.icon-pause'); // ⏸ 일시정지 아이콘 DOM
        const playIcon = toggleBtn2.querySelector('.icon-play');   // ▶ 재생 아이콘 DOM

        // 제어 버튼 클릭 시 자동 재생 상태에 맞춰 정지 또는 시작 명령 수행
        toggleBtn2.addEventListener('click', function () {
            if (swiper2.autoplay.running) {
                // 현재 오토플레이가 켜져있다면 정지시킴
                swiper2.autoplay.stop();
                pauseIcon.classList.add('hidden');
                playIcon.classList.remove('hidden');
                toggleBtn2.setAttribute('aria-label', 'Play Autoplay');
            } else {
                // 현재 오토플레이가 꺼져있다면 재시작시킴
                swiper2.autoplay.start();
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
                toggleBtn2.setAttribute('aria-label', 'Pause Autoplay');
            }
        });

        // [동기화 이벤트] 드래그나 외부 요인에 의해 자동 재생이 강제 정지되었을 때 버튼 상태 업데이트
        swiper2.on('autoplayStop', function () {
            pauseIcon.classList.add('hidden');
            playIcon.classList.remove('hidden');
            toggleBtn2.setAttribute('aria-label', 'Play Autoplay');
        });

        // [동기화 이벤트] 재생 버튼 클릭 등으로 자동 재생이 구동 시작되었을 때 버튼 상태 업데이트
        swiper2.on('autoplayStart', function () {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            toggleBtn2.setAttribute('aria-label', 'Pause Autoplay');
        });
    }


    // -------------------------------------------------------------
    // 3. Swiper 3: 무한 루프 오토 스와이퍼 (Seamless Loop + Autoplay 모델)
    // -------------------------------------------------------------
    // - 2번과 같이 자동 슬라이드 전환 및 수동 정지/재생 인터페이스를 공유합니다.
    // - 무한 루프(loop: true) 옵션을 켜두어 끝 페이지에서 다음 드래그 시 첫 페이지로,
    //   첫 페이지에서 이전 드래그 시 마지막 페이지로 유기적이고 매끄럽게 연결됩니다.
    // -------------------------------------------------------------
    const swiper3 = new Swiper('.swiper-type-3', {
        direction: 'horizontal',
        
        // 무한 루프 활성화 (true: 슬라이드 양방향이 끝없이 자연스럽게 회전 연결됨)
        loop: true,
        
        slidesPerView: 1,
        spaceBetween: 20,
        
        autoplay: {
            delay: 3000,
            disableOnInteraction: true,   // 조작 발생 시 자동 슬라이드 진행 정지
        },
        
        pagination: {
            el: '.pagination-3',
            clickable: true,
        },
        navigation: {
            nextEl: '.btn-next-3',
            prevEl: '.btn-prev-3',
        },
    });

    // Swiper 3의 오토플레이 제어 버튼(재생/일시정지) 동작 로직
    const toggleBtn3 = document.querySelector('.btn-toggle-3');
    if (toggleBtn3) {
        const pauseIcon = toggleBtn3.querySelector('.icon-pause');
        const playIcon = toggleBtn3.querySelector('.icon-play');

        toggleBtn3.addEventListener('click', function () {
            if (swiper3.autoplay.running) {
                swiper3.autoplay.stop();
                pauseIcon.classList.add('hidden');
                playIcon.classList.remove('hidden');
                toggleBtn3.setAttribute('aria-label', 'Play Autoplay');
            } else {
                swiper3.autoplay.start();
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
                toggleBtn3.setAttribute('aria-label', 'Pause Autoplay');
            }
        });

        // [동기화 이벤트] 사용자 조작 및 자연 정지로 오토플레이 중단 시 UI 반영
        swiper3.on('autoplayStop', function () {
            pauseIcon.classList.add('hidden');
            playIcon.classList.remove('hidden');
            toggleBtn3.setAttribute('aria-label', 'Play Autoplay');
        });

        // [동기화 이벤트] 플레이어 활성화로 자동 재생 시작 시 UI 반영
        swiper3.on('autoplayStart', function () {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            toggleBtn3.setAttribute('aria-label', 'Pause Autoplay');
        });
    }


    // -------------------------------------------------------------
    // 4. Swiper 4: 숫자 페이징 루프 스와이퍼 (Fraction Pagination + Loop + Autoplay)
    // -------------------------------------------------------------
    // - 3번 스와이퍼의 모든 루프 오토 재생 규칙을 그대로 상속받습니다.
    // - 핵심 변경 사항: 페이징이 원형 닷(Dot) 형태가 아닌 분수식 숫자 (1 / 3) 형태로 표시됩니다.
    // - Swiper.js의 'fraction' 타입을 적용하여 반응형 모바일 헤더 등에 많이 쓰이는 형태입니다.
    // -------------------------------------------------------------
    const swiper4 = new Swiper('.swiper-type-4', {
        direction: 'horizontal',
        loop: true,
        slidesPerView: 1,
        spaceBetween: 20,
        autoplay: {
            delay: 3000,
            disableOnInteraction: true,   // 터치 드래그 등 사용자 인터랙션 발생 시 자동 구동 즉시 중단
        },
        pagination: {
            el: '.pagination-4',
            type: 'fraction',             // 분수식 페이징 설정 (현재 슬라이드 번호 / 전체 슬라이드 수)
        },
        navigation: {
            nextEl: '.btn-next-4',
            prevEl: '.btn-prev-4',
        },
    });

    // Swiper 4의 오토플레이 제어 버튼(재생/일시정지) 동작 로직 (3번과 동일하게 적용)
    const toggleBtn4 = document.querySelector('.btn-toggle-4');
    if (toggleBtn4) {
        const pauseIcon = toggleBtn4.querySelector('.icon-pause');
        const playIcon = toggleBtn4.querySelector('.icon-play');

        toggleBtn4.addEventListener('click', function () {
            if (swiper4.autoplay.running) {
                swiper4.autoplay.stop();
                pauseIcon.classList.add('hidden');
                playIcon.classList.remove('hidden');
                toggleBtn4.setAttribute('aria-label', 'Play Autoplay');
            } else {
                swiper4.autoplay.start();
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
                toggleBtn4.setAttribute('aria-label', 'Pause Autoplay');
            }
        });

        // [동기화 이벤트] 조작 및 정지로 자동 스와이프 기능 해제 시 아이콘 재생(▶) 상태로 동기화
        swiper4.on('autoplayStop', function () {
            pauseIcon.classList.add('hidden');
            playIcon.classList.remove('hidden');
            toggleBtn4.setAttribute('aria-label', 'Play Autoplay');
        });

        // [동기화 이벤트] 재생 재개 시 아이콘 일시정지(⏸) 상태로 동기화
        swiper4.on('autoplayStart', function () {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            toggleBtn4.setAttribute('aria-label', 'Pause Autoplay');
        });
    }


    // -------------------------------------------------------------
    // 5. 소스 자세히 보기 - 아코디언 토글 제어 및 비동기 JSON 로드 (Collapsible Panel & Async JSON Fetch)
    // -------------------------------------------------------------
    // - 버튼을 누르면 해당 슬라이더의 코드 뷰어가 위아래로 부드럽게 펼쳐집니다.
    // - [성능 최적화]: 최초 클릭 시에만 외부 별도 JSON 파일(.json)을 비동기 fetch로 가져와 파싱합니다.
    // - 로드 성공 시 JSON 내부의 html과 js 필드 데이터를 구조화하여 프리뷰 영역에 정렬해 출력합니다.
    // - 텍스트 로드가 완료되면 패널의 scrollHeight를 다시 계산해 부드러운 높이 모션 트랜지션을 연출합니다.
    // -------------------------------------------------------------
    const sourceToggleBtns = document.querySelectorAll('.source-toggle-btn');
    sourceToggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = btn.getAttribute('data-target');
            const targetWrapper = document.getElementById(targetId);
            const sourceUrl = btn.getAttribute('data-source'); // 가져올 소스 JSON 파일 경로
            const codeElement = targetWrapper.querySelector('code');
            
            // 이미 펼쳐져 활성화된 패널이면 닫기 동작 수행
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                targetWrapper.style.maxHeight = '0px';
                return;
            }
            
            // 아직 소스 코드가 주입되지 않은 최초 클릭 상태라면 비동기 fetch 호출
            if (sourceUrl && codeElement && !codeElement.getAttribute('data-loaded')) {
                // 로딩 메시지 노출 및 임시 팽창
                codeElement.innerText = '소스를 로딩하는 중입니다...';
                targetWrapper.style.maxHeight = '65px';
                btn.classList.add('active');
                
                // 비동기 통신으로 JSON 파일 로드 및 구조화
                fetch(sourceUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('CORS 정책에 의해 서버 환경(HTTP)이 아닐 경우 보안 문제로 JSON을 로드할 수 없습니다.');
                        }
                        return response.json(); // JSON 포맷 파싱
                    })
                    .then(data => {
                        // 구조화된 JSON 데이터에서 HTML 코드와 JS 코드를 분리 추출하여 다단 조립
                        const formattedCode = `<!-- HTML -->\n${data.html}\n\n<!-- JS -->\n${data.js}`;
                        
                        // 콘텐츠 대입 및 로드 완료 상태 플래그 활성화
                        codeElement.innerText = formattedCode;
                        codeElement.setAttribute('data-loaded', 'true');
                        
                        // 로딩 완료 후 늘어난 실시간 콘텐츠 높이를 연산하여 부드러운 아코디언 확장 모션 실행
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                    })
                    .catch(err => {
                        // 예외 및 에러 발생 처리 (로컬 file:// 실행 시 브라우저 CORS 보안 정책 안내 포함)
                        codeElement.innerText = '로딩 실패: ' + err.message + '\n\n[도움말] 브라우저 보안 규정상 로컬 탐색기(file://)가 아닌 로컬 웹 서버(예: npx live-server, VS Code Live Server, Python HTTP Server 등) 환경에서 실행해야 외부 JSON 데이터 로드가 작동합니다.';
                        targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
                    });
            } else {
                // 이미 코드가 한번 성공적으로 로드된 상태라면 단순히 아코디언만 확장
                btn.classList.add('active');
                targetWrapper.style.maxHeight = targetWrapper.scrollHeight + 'px';
            }
        });
    });


    // -------------------------------------------------------------
    // 6. 소스 코드 - 원클릭 클립보드 복사 로직 (Clipboard Copy Utility)
    // -------------------------------------------------------------
    // - 탭 상단의 Copy 버튼 클릭 시 내부 code 태그 텍스트를 클립보드로 전송합니다.
    // - 복사 성공 시 단기 피드백(Copied! 및 컬러 변화)을 제공하여 직관성을 높입니다.
    // -------------------------------------------------------------
    const copyBtns = document.querySelectorAll('.copy-code-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = btn.getAttribute('data-clipboard');
            const targetCodeElement = document.getElementById(targetId).querySelector('code');
            
            if (targetCodeElement) {
                // 아직 코드가 로딩 중이거나 로드되지 않았을 경우 복사 방지
                if (!targetCodeElement.getAttribute('data-loaded')) {
                    alert('소스가 먼저 로드된 상태에서 복사할 수 있습니다.');
                    return;
                }

                const textToCopy = targetCodeElement.innerText;
                
                // 모던 브라우저 Clipboard API 활용하여 복사 실행
                navigator.clipboard.writeText(textToCopy).then(() => {
                    // 복사 성공 피드백: 버튼 명칭 변경 및 전용 CSS 효과 부여
                    btn.innerText = 'Copied!';
                    btn.classList.add('copied');
                    
                    // 2초의 짧은 시간 유지 후 기본 상태로 자동 롤백
                    setTimeout(() => {
                        btn.innerText = 'Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    // 클립보드 접근 불가 등 예외 발생 시 에러 로깅
                    console.error('Failed to copy code: ', err);
                });
            }
        });
    });
});
