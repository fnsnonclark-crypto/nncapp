/**
 * Node.js 기본 모듈을 사용하여 구축한 초경량 웹 서버 스크립트입니다.
 * 이 서버는 정적 파일(HTML, CSS, JS 등)을 서빙하는 동시에, 
 * 클라이언트(브라우저)에서 직원 데이터를 로컬 JSON 파일에 쓰고 읽을 수 있도록 API 엔드포인트를 제공합니다.
 */

const http = require('http'); // HTTP 서버 생성을 위한 기본 모듈
const fs = require('fs');     // 파일 시스템(읽기/쓰기) 제어를 위한 기본 모듈
const path = require('path'); // 파일 경로 조작을 위한 기본 모듈

// 서버가 실행될 포트 번호 설정
const PORT = 8000;

// 직원 데이터가 저장될 JSON 파일의 절대 경로 설정
// 현재 실행 중인 디렉토리(__dirname) 기준으로 'assets/member/members.json'을 가리킵니다.
const MEMBERS_FILE = path.join(__dirname, 'assets', 'member', 'members.json');
const HISTORY_FILE = path.join(__dirname, 'assets', 'member', 'allmember.json');

// 브라우저에게 파일의 종류를 알려주기 위한 MIME 타입 매핑 객체
// 파일을 브라우저로 보낼 때 헤더의 'Content-Type' 값으로 사용됩니다.
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

/**
 * http.createServer를 통해 웹 서버를 생성하고, 모든 HTTP 요청(req)에 대해 응답(res)을 처리합니다.
 */
const server = http.createServer((req, res) => {
    
    // -----------------------------------------------------
    // 1. CORS (Cross-Origin Resource Sharing) 설정
    // -----------------------------------------------------
    // 브라우저 보안 정책에 의해 API 요청이 차단되는 것을 방지합니다.
    res.setHeader('Access-Control-Allow-Origin', '*'); // 모든 도메인에서의 접근 허용
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // 허용할 HTTP 메서드 정의
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // 허용할 요청 헤더 정의

    // OPTIONS 메서드는 클라이언트가 실제 통신 전에 권한을 확인하는 '사전 요청(Preflight)'입니다.
    // 204 No Content 상태 코드로 응답하여 바로 통과시킵니다.
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // -----------------------------------------------------
    // 2. API 라우팅 (직원 데이터 및 출퇴근 기록 JSON 파일 읽기 및 쓰기)
    // -----------------------------------------------------
    // 프론트엔드에서 '/api/members' 주소로 데이터를 요청하거나 보낼 때 처리합니다.
    if (req.url === '/api/members') {
        
        // GET 요청: 서버에 저장된 JSON 파일을 읽어서 프론트엔드로 보내줍니다.
        if (req.method === 'GET') {
            fs.readFile(MEMBERS_FILE, 'utf8', (err, data) => {
                if (err) {
                    console.error('File read error:', err);
                    // 파일을 읽지 못하면 HTTP 500 에러를 반환합니다.
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Failed to read members file' }));
                }
                // 정상적으로 읽었으면 HTTP 200 성공 코드와 함께 JSON 문자열을 보냅니다.
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            });
            return; // API 처리를 완료했으므로 아래의 정적 파일 서빙 로직으로 넘어가지 않게 종료
        }

        // POST 요청: 프론트엔드에서 새로운 직원 데이터를 보냈을 때 이를 JSON 파일에 덮어씁니다.
        if (req.method === 'POST') {
            let body = '';
            
            // 데이터가 스트림 형태로 여러 번에 걸쳐 들어오므로 조각(chunk)을 합칩니다.
            req.on('data', chunk => { body += chunk.toString(); });
            
            // 모든 데이터 수신이 완료되면 파일에 기록합니다.
            req.on('end', () => {
                fs.writeFile(MEMBERS_FILE, body, 'utf8', (err) => {
                    if (err) {
                        console.error('File write error:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Failed to write members file' }));
                    }
                    // 쓰기 성공 시 HTTP 200 상태와 함께 success 메세지를 반환합니다.
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true }));
                });
            });
            return; // API 처리를 완료했으므로 종료
        }
    }

    // 출퇴근 전체 기록 (allmember.json) 라우팅 추가
    if (req.url === '/api/history') {
        if (req.method === 'GET') {
            fs.readFile(HISTORY_FILE, 'utf8', (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        // 파일이 아직 생성되지 않았다면 빈 배열 반환
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        return res.end('[]');
                    }
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Failed to read history file' }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            });
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                fs.writeFile(HISTORY_FILE, body, 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Failed to write history file' }));
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true }));
                });
            });
            return;
        }
    }

    // -----------------------------------------------------
    // 3. 정적 파일 서빙 (HTML, CSS, JS 호스팅)
    // -----------------------------------------------------
    
    // 사용자가 'http://localhost:8000/' 에 접속하면 기본적으로 'index.html'을 보여주도록 경로를 설정합니다.
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // URL에 파라미터(예: ?id=1)가 붙어있는 경우, 실제 파일 경로를 찾기 위해 파라미터를 떼어냅니다.
    filePath = filePath.split('?')[0];
    
    // 요청한 URL을 서버의 실제 물리적 하드디스크 경로로 변환합니다.
    const absolutePath = path.join(__dirname, filePath);

    // 해당 경로에 파일이 실제로 존재하는지 확인합니다.
    fs.stat(absolutePath, (err, stats) => {
        // 파일이 없거나 디렉토리인 경우 HTTP 404 (Not Found) 에러를 반환합니다.
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
        }

        // 파일의 확장자를 추출하여 앞서 정의한 MIME_TYPES 객체에서 적절한 Content-Type을 찾습니다.
        const extname = path.extname(absolutePath);
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';

        // 해당 파일을 읽어서 브라우저에 전송합니다.
        fs.readFile(absolutePath, (err, data) => {
            if (err) {
                // 파일 읽기 중 알 수 없는 에러가 발생하면 HTTP 500 에러를 반환합니다.
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('500 Internal Server Error');
            }
            // HTML 파일인 경우 한글 깨짐을 방지하기 위해 강제로 UTF-8 인코딩을 명시해줍니다.
            const finalContentType = contentType === 'text/html' ? 'text/html; charset=utf-8' : contentType;
            
            // 성공 응답(200)과 함께 파일 데이터를 전송합니다.
            res.writeHead(200, { 'Content-Type': finalContentType });
            res.end(data);
        });
    });
});

// -----------------------------------------------------
// 4. 초기화 및 서버 구동
// -----------------------------------------------------

// 서버가 시작되기 전, 데이터를 저장할 'assets/member' 폴더가 실제로 존재하는지 확인합니다.
const memberDir = path.dirname(MEMBERS_FILE);
if (!fs.existsSync(memberDir)) {
    // 폴더가 없으면 에러를 뿜지 않고 자동 생성합니다. (recursive 옵션을 통해 상위 폴더까지 한 번에 생성)
    fs.mkdirSync(memberDir, { recursive: true });
}

// 위에서 설정한 PORT 번호(8000)로 서버를 엽니다.
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`API Endpoint: http://localhost:${PORT}/api/members`);
});
