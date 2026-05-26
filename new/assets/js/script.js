// ==========================================
// 전역 가상 데이터 및 초기화 (API 연동 -> Supabase 연동)
// ==========================================

const supabaseUrl = 'https://yvsyfisstgjofhgvxccl.supabase.co';
const supabaseKey = 'sb_publishable_MQ5MVCQIdNnYJ69_5wnCRA_7mvLd3RB';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

/**
 * Supabase에서 전체 사용자(직원) 목록을 가져옵니다.
 * @returns {Promise<Array>} 사용자 객체 배열
 */
async function fetchMembers() {
    try {
        const { data, error } = await supabase.from('member').select('*');
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Fetch error:', err);
        return [];
    }
}

/**
 * Supabase에 직원 목록을 저장(upsert)합니다.
 * @param {Array} members 저장할 직원 배열
 * @returns {Promise<boolean>} 성공 여부
 */
async function saveMembers(members) {
    try {
        const { error } = await supabase.from('member').upsert(members);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Save error:', err);
        return false;
    }
}

/**
 * Supabase에서 직원을 삭제합니다.
 * @param {Array<string>} emails 삭제할 이메일 배열
 */
async function deleteMembers(emails) {
    try {
        const { error } = await supabase.from('member').delete().in('email', emails);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Delete error:', err);
        return false;
    }
}

/**
 * Supabase에서 전체 출퇴근 기록을 가져옵니다.
 * @returns {Promise<Array>} 출퇴근 기록 객체 배열
 */
async function fetchHistory() {
    try {
        const { data, error } = await supabase.from('attendance').select('*');
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Fetch history error:', err);
        return [];
    }
}

/**
 * Supabase에 출퇴근 기록을 저장(upsert)합니다.
 * @param {Array} historyData 저장할 기록 배열
 * @returns {Promise<boolean>} 성공 여부
 */
async function saveHistory(historyData) {
    try {
        const { error } = await supabase.from('attendance').upsert(historyData);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Save history error:', err);
        return false;
    }
}

// ==========================================
// 세션 관리 유틸리티 (로그인 유지용)
// ==========================================

/**
 * 세션 스토리지에 데이터를 저장합니다.
 * @param {string} key 저장할 데이터의 키
 * @param {any} value 저장할 데이터의 값
 */
const setSession = (key, value) => sessionStorage.setItem(key, JSON.stringify(value));

/**
 * 세션 스토리지에서 데이터를 불러옵니다.
 * @param {string} key 불러올 데이터의 키
 * @returns {any} 저장된 데이터 객체
 */
const getSession = (key) => JSON.parse(sessionStorage.getItem(key));

/**
 * 세션 스토리지의 모든 데이터를 삭제합니다. (로그아웃 처리 시 사용)
 */
const clearSession = () => sessionStorage.clear();

/**
 * 현재 사용자의 인증 상태를 확인합니다.
 * 로그인이 안 되어 있거나 권한이 부족하면 이전 페이지로 튕겨냅니다.
 * @param {boolean} requireAdmin 관리자 권한 필수 여부
 * @returns {Object|null} 현재 로그인한 사용자 객체. 실패 시 null.
 */
function checkAuth(requireAdmin = false) {
    const user = getSession('currentUser');
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    if (requireAdmin && user.role !== 'admin') {
        alert('관리자 권한이 필요합니다.');
        window.location.href = 'main.html';
        return null;
    }
    return user;
}

// ==========================================
// 가상 데이터 생성 유틸리티 (마이페이지용)
// ==========================================

/**
 * 마이페이지용: 이번 달 출퇴근 가상 기록을 생성합니다. (주말 제외)
 * @returns {Array} 날짜별 출퇴근 기록 배열
 */
function getMockMonthlyHistory() {
    const history = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    for (let i = 1; i <= now.getDate() - 1; i++) {
        const date = new Date(year, month, i);
        if (date.getDay() === 0 || date.getDay() === 6) continue; // 주말 건너뛰기
        
        const isLate = Math.random() > 0.8;
        const clockInHour = isLate ? 9 : 8;
        const clockInMin = isLate ? Math.floor(Math.random() * 30) + 1 : Math.floor(Math.random() * 45) + 10;
        
        const clockOutHour = 18;
        const clockOutMin = Math.floor(Math.random() * 30);
        
        history.push({
            date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
            clockIn: `${String(clockInHour).padStart(2, '0')}:${String(clockInMin).padStart(2, '0')}`,
            clockOut: `${clockOutHour}:${String(clockOutMin).padStart(2, '0')}`,
            status: isLate ? '지각' : '정상'
        });
    }
    return history.reverse(); // 최신 날짜가 위로 오도록 정렬
}

// ==========================================
// 공통 로직
// ==========================================

/**
 * 로그아웃 버튼 클릭 시 실행되는 함수
 * 세션을 비우고 로그인 페이지로 이동합니다.
 */
window.logout = function() {
    clearSession();
    window.location.href = 'index.html';
};

// ==========================================
// 관리자 전용 백그라운드 로직 (18:00 이후 일반직원 자동 퇴근)
// ==========================================
function startAdminAutoClockOut() {
    const user = getSession('currentUser');
    if (!user || user.role !== 'admin') return;

    async function checkAndAutoClockOut() {
        const now = new Date();
        if (now.getHours() >= 18) {
            let users = await fetchMembers();
            let changed = false;
            
            users.forEach(u => {
                // 관리자가 아니고, 출근은 했으나 퇴근 안 했고, 상태가 야근이 아닌 경우
                if (u.role !== 'admin' && 
                    u.clockIn && u.clockIn !== '-' && 
                    (!u.clockOut || u.clockOut === '-') && 
                    u.status !== '야근') {
                    
                    u.clockOut = '18:00'; // 18시 정각 퇴근 처리
                    u.status = '퇴근완료';
                    changed = true;
                }
            });
            
            if (changed) {
                await saveMembers(users);
                
                const historyData = await fetchHistory();
                const todayStr = now.toISOString().split('T')[0];
                let historyChanged = false;
                
                users.forEach(u => {
                    if (u.role !== 'admin' && u.clockOut === '18:00') {
                        const record = historyData.find(h => h.userId === u.email && h.date === todayStr);
                        if (record && (!record.clockOut || record.clockOut === '-')) {
                            record.clockOut = '18:00';
                            record.status = '퇴근완료';
                            historyChanged = true;
                        }
                    }
                });
                
                if (historyChanged) {
                    await saveHistory(historyData);
                }
                
                // 관리자 화면 갱신 이벤트 발생
                window.dispatchEvent(new Event('membersUpdated'));
            }
        }
    }
    
    // 1분(60초)마다 체크
    setInterval(checkAndAutoClockOut, 60000);
    // 5초 뒤 1회 초기 체크 (다른 로딩 완료 후)
    setTimeout(checkAndAutoClockOut, 5000);
}

// 돔 로드 시 관리자 백그라운드 스크립트 실행 (로그인 페이지 제외)
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && !window.location.pathname.endsWith('test_web/')) {
    document.addEventListener('DOMContentLoaded', () => {
        startAdminAutoClockOut();
    });
}

// ==========================================
// 페이지별 개별 로직
// ==========================================

// 1. 로그인 페이지 로직
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('test_web/')) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                // API를 통해 JSON 파일의 데이터를 비동기로 불러옴
                const users = await fetchMembers();
                const user = users.find(u => u.email === email && u.password === password);
                
                if (user) {
                    setSession('currentUser', user); // 세션에 저장
                    window.location.href = 'main.html';
                } else {
                    alert('이메일 또는 비밀번호가 일치하지 않습니다.\n테스트 계정: user@test.com / password\n관리자 계정: admin@test.com / password');
                }
            });
        }
        
        // 회원가입 모달 로직
        const btnOpenReg = document.getElementById('btnOpenRegister');
        const btnCloseReg = document.getElementById('btnCloseRegister');
        const regModal = document.getElementById('registerModal');
        const signupForm = document.getElementById('signupForm');

        if (btnOpenReg && btnCloseReg && regModal) {
            btnOpenReg.addEventListener('click', () => regModal.classList.add('active'));
            btnCloseReg.addEventListener('click', () => regModal.classList.remove('active'));
            regModal.addEventListener('click', (e) => {
                if(e.target === regModal) regModal.classList.remove('active');
            });
        }

        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('signupEmail').value;
                const name = document.getElementById('signupName').value;
                const dept = document.getElementById('signupDept').value;
                const pwd = document.getElementById('signupPassword').value;
                const pwdConfirm = document.getElementById('signupConfirmPassword').value;

                if (pwd !== pwdConfirm) {
                    alert('비밀번호가 일치하지 않습니다.');
                    return;
                }

                const membersData = await fetchMembers();
                if (membersData.some(u => u.email === email)) {
                    alert('이미 등록된 이메일입니다.');
                    return;
                }

                const newUser = {
                    id: Date.now(),
                    email: email,
                    password: pwd,
                    name: name,
                    dept: dept,
                    role: 'user',
                    clockIn: '-',
                    clockOut: '-',
                    status: '미출근'
                };

                membersData.push(newUser);
                const isSuccess = await saveMembers(membersData);

                if (isSuccess) {
                    alert(`${name}님의 정보 등록이 완료되었습니다!\n이제 로그인하실 수 있습니다.`);
                    signupForm.reset();
                    regModal.classList.remove('active');
                } else {
                    alert('정보 등록 중 오류가 발생했습니다.');
                }
            });
        }
    });
}

// 2. 메인 페이지 로직 (출퇴근 버튼 및 시계)
if (window.location.pathname.endsWith('main.html')) {
    const user = checkAuth();
    
    document.addEventListener('DOMContentLoaded', () => {
        if (!user) return;
        
        document.getElementById('userName').textContent = `${user.name}님`;
        if(user.role === 'admin') {
            document.getElementById('adminLink').style.display = 'block';
        }
        
        // 현재 시간 표시 시계 기능
        const timeDisplay = document.getElementById('currentTime');
        const dateDisplay = document.getElementById('currentDate');
        
        let lastOvertimePopupHour = -1;
        let lastOvertimePopupMinute = -1;
        let isOvertimePopupOpen = false;

        function updateClock() {
            const now = new Date();
            timeDisplay.textContent = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            dateDisplay.textContent = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
            
            // 18:00 이후 퇴근 안 했을 경우 10분 마다 야근 확인 팝업
            const hour = now.getHours();
            const minute = now.getMinutes();
            if (hour >= 18 && attendanceState.clockIn && !attendanceState.clockOut) {
                if (minute % 10 === 0) {
                    if (!isOvertimePopupOpen && (lastOvertimePopupHour !== hour || lastOvertimePopupMinute !== minute)) {
                        isOvertimePopupOpen = true;
                        lastOvertimePopupHour = hour;
                        lastOvertimePopupMinute = minute;
                        showOvertimePopup();
                    }
                }
            }
        }
        
        let overtimeTimeoutId = null;

        function showOvertimePopup() {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.zIndex = '9999';
            
            const popup = document.createElement('div');
            popup.className = 'glass-panel fade-in';
            popup.style.padding = '2.5rem';
            popup.style.textAlign = 'center';
            popup.style.minWidth = '300px';
            
            const title = document.createElement('h3');
            title.textContent = '근무중입니까?';
            title.style.marginBottom = '1.5rem';
            title.style.fontSize = '1.2rem';
            
            const btn = document.createElement('button');
            btn.className = 'btn-primary';
            btn.innerHTML = '<i class="fa-solid fa-check"></i> 근무중';
            btn.style.width = '100%';
            
            btn.onclick = async () => {
                if (overtimeTimeoutId) clearTimeout(overtimeTimeoutId);
                btn.disabled = true;
                btn.textContent = '처리 중...';
                
                // 상태를 야근으로 로컬스토리지 및 서버 업데이트
                attendanceState.status = '야근';
                localStorage.setItem(`attendance_${user.id}_${today}`, JSON.stringify(attendanceState));
                
                const users = await fetchMembers();
                const me = users.find(u => u.email === user.email);
                if (me) {
                    me.status = '야근';
                    await saveMembers(users);
                }
                
                const historyData = await fetchHistory();
                const todayStr = new Date().toISOString().split('T')[0];
                const myRecord = historyData.find(h => h.userId === user.email && h.date === todayStr);
                if (myRecord) {
                    myRecord.status = '야근';
                    await saveHistory(historyData);
                }
                
                updateUI();
                document.body.removeChild(overlay);
                isOvertimePopupOpen = false;
            };
            
            popup.appendChild(title);
            popup.appendChild(btn);
            overlay.appendChild(popup);
            document.body.appendChild(overlay);

            // 아무 버튼 클릭이 없을 시 1분(60초) 뒤 자동 퇴근 처리
            overtimeTimeoutId = setTimeout(async () => {
                if (isOvertimePopupOpen) {
                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                    isOvertimePopupOpen = false;
                    
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
                    await performClockOut(timeStr);
                    alert('응답이 없어 자동 퇴근 처리되었습니다.');
                }
            }, 60000);
        }
        
        setInterval(updateClock, 1000);
        updateClock();
        
        // 출퇴근 처리 로직
        const btnClockIn = document.getElementById('btnClockIn');
        const btnClockOut = document.getElementById('btnClockOut');
        const statusBadge = document.getElementById('statusBadge');
        const statusText = document.getElementById('statusText');
        const inTimeDisplay = document.getElementById('inTime');
        const outTimeDisplay = document.getElementById('outTime');
        
        const today = new Date().toLocaleDateString('ko-KR');
        const attendanceState = JSON.parse(localStorage.getItem(`attendance_${user.id}_${today}`)) || { clockIn: null, clockOut: null, status: null };
        
        /**
         * 화면의 출퇴근 버튼 및 상태 텍스트를 업데이트하는 함수
         */
        function updateUI() {
            if (attendanceState.clockIn) {
                btnClockIn.disabled = true;
                inTimeDisplay.textContent = attendanceState.clockIn;
                
                if (attendanceState.clockOut) {
                    btnClockOut.disabled = true;
                    outTimeDisplay.textContent = attendanceState.clockOut;
                    statusBadge.className = 'status-badge on-time';
                    statusBadge.style = ''; // reset inline styles
                    statusBadge.textContent = '퇴근완료';
                    statusText.textContent = '오늘 하루도 수고하셨습니다.';
                } else {
                    btnClockOut.disabled = false;
                    
                    if (attendanceState.status === '야근') {
                        statusBadge.className = 'status-badge';
                        statusBadge.style.backgroundColor = 'var(--warning)';
                        statusBadge.style.borderColor = 'var(--warning)';
                        statusBadge.style.color = '#fff';
                        statusBadge.textContent = '야근';
                        statusText.textContent = '야근 근무 확인되었습니다.';
                    } else if (attendanceState.status === '지각') {
                        statusBadge.className = 'status-badge late';
                        statusBadge.style = '';
                        statusBadge.textContent = '지각(근무중)';
                        statusText.textContent = '현재 근무중입니다.';
                    } else {
                        statusBadge.className = 'status-badge on-time';
                        statusBadge.style = '';
                        statusBadge.textContent = '근무중';
                        statusText.textContent = '현재 근무중입니다.';
                    }
                }
            } else {
                btnClockIn.disabled = false;
                btnClockOut.disabled = true;
                statusBadge.className = 'status-badge not-started';
                statusBadge.style = '';
                statusBadge.textContent = '미출근';
                statusText.textContent = '출근 전입니다.';
                inTimeDisplay.textContent = '-';
                outTimeDisplay.textContent = '-';
            }
        }
        
        // 출근 기록 버튼 클릭 이벤트 (JSON 파일 내 직원 상태 및 전체 기록 업데이트)
        btnClockIn.addEventListener('click', async () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
            
            // 9시 초과 지각 판단
            const hour = now.getHours();
            const minute = now.getMinutes();
            const isLate = (hour > 9) || (hour === 9 && minute > 0);
            const currentStatus = isLate ? '지각' : '정상';
            
            attendanceState.clockIn = timeStr;
            attendanceState.status = currentStatus;
            localStorage.setItem(`attendance_${user.id}_${today}`, JSON.stringify(attendanceState));
            
            // 1. members.json 업데이트
            const users = await fetchMembers();
            const me = users.find(u => u.email === user.email);
            if (me) {
                me.clockIn = timeStr;
                me.status = currentStatus;
                await saveMembers(users);
            }
            
            // 2. allmember.json 업데이트 (전체 출퇴근 기록)
            const historyData = await fetchHistory();
            const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            historyData.push({
                userId: user.email,
                name: user.name,
                date: todayStr,
                clockIn: timeStr,
                clockOut: '-',
                status: currentStatus
            });
            await saveHistory(historyData);
            
            updateUI();
        });
        
        // 퇴근 공통 처리 함수
        async function performClockOut(timeStr) {
            attendanceState.clockOut = timeStr;
            attendanceState.status = '퇴근완료';
            localStorage.setItem(`attendance_${user.id}_${today}`, JSON.stringify(attendanceState));
            
            // 1. members.json 업데이트
            const users = await fetchMembers();
            const me = users.find(u => u.email === user.email);
            if (me) {
                me.clockOut = timeStr;
                me.status = '퇴근완료';
                await saveMembers(users);
            }
            
            // 2. allmember.json 업데이트
            const historyData = await fetchHistory();
            const todayStr = new Date().toISOString().split('T')[0];
            const myRecord = historyData.find(h => h.userId === user.email && h.date === todayStr);
            if (myRecord) {
                myRecord.clockOut = timeStr;
                myRecord.status = '퇴근완료';
            } else {
                historyData.push({
                    userId: user.email,
                    name: user.name,
                    date: todayStr,
                    clockIn: attendanceState.clockIn || '-',
                    clockOut: timeStr,
                    status: '퇴근완료'
                });
            }
            await saveHistory(historyData);
            
            updateUI();
        }

        // 퇴근 기록 버튼 클릭 이벤트 (JSON 파일 내 직원 상태 업데이트)
        btnClockOut.addEventListener('click', async () => {
            if(confirm('정말 퇴근하시겠습니까?')) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
                await performClockOut(timeStr);
            }
        });
        
        updateUI(); // 초기 진입 시 화면 업데이트 실행
    });
}

// 3. 마이페이지 로직 (개인 출퇴근 기록)
if (window.location.pathname.endsWith('mypage.html')) {
    const user = checkAuth();
    
    document.addEventListener('DOMContentLoaded', async () => {
        if (!user) return;
        
        document.getElementById('userName').textContent = `${user.name}님`;
        if(user.role === 'admin') {
            document.getElementById('adminLink').style.display = 'block';
        }
        
        const tbody = document.getElementById('historyTableBody');
        
        // 서버에서 전체 기록을 불러와서 본인 기록만 필터링
        const allHistory = await fetchHistory();
        let myHistory = allHistory.filter(h => h.userId === user.email);
        
        // 최신 날짜가 위로 오도록 정렬
        myHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if(myHistory.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem;">기록이 없습니다.</td></tr>`;
            return;
        }
        
        // 테이블 데이터 렌더링
        myHistory.forEach((record, index) => {
            const tr = document.createElement('tr');
            tr.className = 'fade-in';
            tr.style.animationDelay = `${index * 0.05}s`;
            
            let statusClass = 'on-time';
            if (record.status === '지각') statusClass = 'late';
            
            tr.innerHTML = `
                <td>${record.date}</td>
                <td>${record.clockIn}</td>
                <td>${record.clockOut}</td>
                <td><span class="status-badge ${statusClass}">${record.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    });
}

// 4. 관리자 페이지 로직 (전체 직원 모니터링 및 JSON을 이용한 신규 등록/수정)
if (window.location.pathname.endsWith('admin.html')) {
    const user = checkAuth(true); // requireAdmin = true
    
    document.addEventListener('DOMContentLoaded', async () => {
        if (!user) return;
        
        document.getElementById('userName').textContent = `${user.name}님`;
        const tbody = document.getElementById('adminTableBody');
        
        /**
         * 관리자용 테이블을 렌더링하는 함수 (JSON 데이터 기반)
         * @param {Array} data JSON 직원 근태 데이터 배열
         */
        function renderAdminTable(data) {
            tbody.innerHTML = '';
            
            // 전체 선택 체크박스 초기화
            const selectAll = document.getElementById('selectAll');
            if (selectAll) selectAll.checked = false;
            
            data.forEach((record, index) => {
                const tr = document.createElement('tr');
                tr.className = 'fade-in';
                tr.style.animationDelay = `${index * 0.05}s`;
                
                let statusClass = 'on-time';
                if (record.status === '지각') statusClass = 'late';
                if (record.status === '미출근') statusClass = 'not-started';
                
                const isAdmin = record.role === 'admin' || record.email === 'admin@test.com';
                const checkboxHtml = isAdmin 
                    ? `<input type="checkbox" class="row-checkbox" value="${record.email}" disabled title="관리자 계정은 삭제할 수 없습니다.">` 
                    : `<input type="checkbox" class="row-checkbox" value="${record.email}">`;
                
                tr.innerHTML = `
                    <td style="text-align: center;">${checkboxHtml}</td>
                    <td><strong>${record.name}</strong></td>
                    <td>${record.dept}</td>
                    <td>${record.clockIn || '-'}</td>
                    <td>${record.clockOut || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${record.status || '미출근'}</span></td>
                    <td style="color: var(--text-muted); font-size: 0.9em;">${record.email}</td>
                `;
                tbody.appendChild(tr);
            });
            
            // 개별 체크박스 이벤트 리스너 (전체 선택/해제 연동)
            const rowCheckboxes = document.querySelectorAll('.row-checkbox');
            rowCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    if (!cb.checked && selectAll) selectAll.checked = false;
                    const allChecked = Array.from(rowCheckboxes).every(c => c.checked);
                    if (allChecked && selectAll) selectAll.checked = true;
                });
            });
        }
        
        // 서버에서 초기 멤버 데이터를 불러와서 테이블에 표시
        let membersData = await fetchMembers();
        renderAdminTable(membersData);
        
        // 백그라운드 자동 퇴근 로직 등에 의한 업데이트 감지
        window.addEventListener('membersUpdated', async () => {
            membersData = await fetchMembers();
            renderAdminTable(membersData);
        });
        
        // 신규 직원 등록 폼 처리 이벤트 (JSON 파일에 쓰기)
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('regName').value;
                const email = document.getElementById('regEmail').value;
                const password = document.getElementById('regPassword').value;
                const dept = document.getElementById('regDept').value;
                
                // 최신 데이터를 다시 불러옴
                membersData = await fetchMembers();
                
                // 이메일 중복 체크
                if (membersData.some(u => u.email === email)) {
                    alert('이미 등록된 이메일입니다.');
                    return;
                }
                
                // 새 직원 객체 생성
                const newUser = { 
                    id: Date.now(), 
                    email: email, 
                    password: password, // 입력받은 비밀번호 적용
                    name: name, 
                    dept: dept, 
                    role: 'user',
                    clockIn: '-',
                    clockOut: '-',
                    status: '미출근'
                };
                
                // 배열에 추가 후 API를 통해 파일 저장
                membersData.push(newUser);
                const isSuccess = await saveMembers(membersData);
                
                if (isSuccess) {
                    // 화면 갱신 및 폼 초기화
                    renderAdminTable(membersData);
                    alert(`${name} 직원이 등록되었습니다.\n로그인 계정: ${email} / 입력한 비밀번호`);
                    registerForm.reset();
                } else {
                    alert('직원 등록(저장) 중 오류가 발생했습니다.');
                }
            });
        }

        // 전체 데이터 JSON 저장
        const btnExportJson = document.getElementById('btnExportJson');
        if (btnExportJson) {
            btnExportJson.addEventListener('click', async () => {
                const latestData = await fetchMembers();
                const dataStr = JSON.stringify(latestData, null, 2);
                
                const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `직원근태현황_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '').replace(/ /g, '')}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }

        // 전체 선택 체크박스 이벤트
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const rowCheckboxes = document.querySelectorAll('.row-checkbox');
                rowCheckboxes.forEach(cb => cb.checked = e.target.checked);
            });
        }

        // 모든 직원 퇴근처리 버튼 이벤트
        const btnClockOutAll = document.getElementById('btnClockOutAll');
        if (btnClockOutAll) {
            btnClockOutAll.addEventListener('click', async () => {
                const activeEmployees = membersData.filter(u => u.clockIn && u.clockIn !== '-' && (!u.clockOut || u.clockOut === '-'));
                
                if (activeEmployees.length === 0) {
                    alert('현재 퇴근 처리할 직원이 없습니다. (모두 퇴근했거나 미출근 상태입니다)');
                    return;
                }
                
                if (confirm(`현재 출근 중인 직원 ${activeEmployees.length}명을 일괄 퇴근 처리하시겠습니까?`)) {
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
                    const todayStr = now.toISOString().split('T')[0];
                    let historyChanged = false;
                    
                    const historyData = await fetchHistory();
                    
                    // 상태 업데이트
                    activeEmployees.forEach(u => {
                        u.clockOut = timeStr;
                        u.status = '퇴근완료';
                        
                        // history 업데이트
                        const record = historyData.find(h => h.userId === u.email && h.date === todayStr);
                        if (record && (!record.clockOut || record.clockOut === '-')) {
                            record.clockOut = timeStr;
                            record.status = '퇴근완료';
                            historyChanged = true;
                        }
                    });
                    
                    const isSuccess = await saveMembers(membersData);
                    if (historyChanged) await saveHistory(historyData);
                    
                    if (isSuccess) {
                        renderAdminTable(membersData);
                        alert(`총 ${activeEmployees.length}명의 직원이 ${timeStr} 기준으로 일괄 퇴근 처리되었습니다.`);
                    } else {
                        alert('퇴근 처리 중 오류가 발생했습니다.');
                    }
                }
            });
        }

        // 선택 삭제 버튼 이벤트
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected) {
            btnDeleteSelected.addEventListener('click', async () => {
                const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
                if (checkedBoxes.length === 0) {
                    alert('삭제할 직원을 선택해주세요.');
                    return;
                }
                
                if (confirm(`선택한 ${checkedBoxes.length}명의 직원을 정말 삭제하시겠습니까?`)) {
                    const emailsToDelete = Array.from(checkedBoxes).map(cb => cb.value).filter(email => email !== 'admin@test.com');
                    
                    const isSuccess = await deleteMembers(emailsToDelete);
                    if (isSuccess) {
                        membersData = await fetchMembers();
                        renderAdminTable(membersData);
                        alert('선택한 직원이 삭제되었습니다.');
                    } else {
                        alert('삭제 중 오류가 발생했습니다.');
                    }
                }
            });
        }

        // 전체 삭제 버튼 이벤트
        const btnDeleteAll = document.getElementById('btnDeleteAll');
        if (btnDeleteAll) {
            btnDeleteAll.addEventListener('click', async () => {
                const nonAdmins = membersData.filter(u => u.role !== 'admin' && u.email !== 'admin@test.com');
                if (nonAdmins.length === 0) {
                    alert('삭제할 데이터가 없습니다.');
                    return;
                }
                
                if (confirm('정말 모든 직원의 정보를 삭제하시겠습니까?\\n(관리자 계정은 제외됩니다) 이 작업은 되돌릴 수 없습니다.')) {
                    const emailsToDelete = nonAdmins.map(u => u.email);
                    const isSuccess = await deleteMembers(emailsToDelete);
                    if (isSuccess) {
                        membersData = await fetchMembers();
                        renderAdminTable(membersData);
                        alert('모든 직원 정보가 삭제되었습니다.');
                    } else {
                        alert('삭제 중 오류가 발생했습니다.');
                    }
                }
            });
        }
    });
}
