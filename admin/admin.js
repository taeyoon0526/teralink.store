// ========================================
// TERALINK 관리자 대시보드 v1.0.0
// 보안 중심 관리 시스템
// ========================================

// 전역 상태
let adminSession = null;
let sessionStartTime = null;
let sessionTimer = null;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  checkExistingSession();
  initEventListeners();
});

// ========================================
// 로그인 처리
// ========================================
document.getElementById('login-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  await handleLogin();
});

async function handleLogin() {
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value;
  const totp = document.getElementById('admin-totp').value.trim();
  const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
  
  const statusEl = document.getElementById('login-status');
  statusEl.textContent = '';
  statusEl.className = 'status-message';
  
  // 검증
  if (!username || !password || !totp) {
    showStatus('모든 필드를 입력해주세요', 'error');
    return;
  }
  
  if (totp.length !== 6 || !/^\d{6}$/.test(totp)) {
    showStatus('2FA 코드는 6자리 숫자여야 합니다', 'error');
    return;
  }
  
  if (!turnstileToken) {
    showStatus('보안 검증(캡챠)을 완료해주세요', 'error');
    return;
  }
  
  // 로그인 시도
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password,
        totp,
        turnstile_token: turnstileToken
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showStatus(data.error || '로그인 실패', 'error');
      // Turnstile 리셋
      if (window.turnstile) {
        turnstile.reset();
      }
      return;
    }
    
    // 로그인 성공
    adminSession = {
      token: data.token,
      username: data.username,
      permissions: data.permissions || []
    };
    
    sessionStorage.setItem('admin_session', JSON.stringify(adminSession));
    sessionStartTime = Date.now();
    
    showStatus('로그인 성공! 대시보드를 로드합니다...', 'success');
    
    setTimeout(() => {
      showDashboard();
    }, 500);
    
  } catch (error) {
    showStatus('서버 오류가 발생했습니다', 'error');
    console.error('Login error:', error);
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById('login-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
  }
}

// ========================================
// 세션 관리
// ========================================
function checkExistingSession() {
  const savedSession = sessionStorage.getItem('admin_session');
  if (savedSession) {
    try {
      adminSession = JSON.parse(savedSession);
      showDashboard();
    } catch (e) {
      sessionStorage.removeItem('admin_session');
    }
  }
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  
  // 관리자 이름 표시
  document.getElementById('admin-name').textContent = adminSession?.username || 'Admin';
  
  // 세션 타이머 시작
  startSessionTimer();
  
  // 대시보드 데이터 로드
  loadDashboardData();
}

function startSessionTimer() {
  sessionStartTime = Date.now();
  
  if (sessionTimer) {
    clearInterval(sessionTimer);
  }
  
  sessionTimer = setInterval(() => {
    const elapsed = Date.now() - sessionStartTime;
    const remaining = SESSION_TIMEOUT - elapsed;
    
    if (remaining <= 0) {
      logout('세션이 만료되었습니다');
      return;
    }
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    document.getElementById('session-timer').textContent = 
      `세션: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

function logout(message) {
  if (sessionTimer) {
    clearInterval(sessionTimer);
  }
  
  sessionStorage.removeItem('admin_session');
  adminSession = null;
  
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  
  // 폼 초기화
  document.getElementById('login-form').reset();
  
  if (message) {
    showStatus(message, 'error');
  }
  
  // Turnstile 리셋
  if (window.turnstile) {
    turnstile.reset();
  }
}

// ========================================
// 탭 전환
// ========================================
function initEventListeners() {
  // 탭 메뉴 클릭
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      switchTab(targetTab);
    });
  });
}

function switchTab(tabName) {
  // 메뉴 활성화 상태 변경
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.tab === tabName) {
      item.classList.add('active');
    }
  });
  
  // 탭 콘텐츠 표시
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const targetContent = document.getElementById(`tab-${tabName}`);
  if (targetContent) {
    targetContent.classList.add('active');
    
    // 탭별 데이터 로드
    loadTabData(tabName);
  }
}

// ========================================
// 대시보드 데이터 로드
// ========================================
async function loadDashboardData() {
  try {
    const response = await fetch('/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout('인증이 만료되었습니다');
        return;
      }
      throw new Error('Failed to load dashboard data');
    }
    
    const data = await response.json();
    
    // 통계 업데이트
    document.getElementById('stat-pending-apps').textContent = data.pending_applications || 0;
    document.getElementById('stat-active-users').textContent = data.active_users || 0;
    document.getElementById('stat-short-urls').textContent = data.short_urls_count || 0;
    document.getElementById('stat-today-visitors').textContent = data.today_visitors || 0;
    
    // 최근 활동 표시
    displayRecentActivity(data.recent_activity || []);
    
  } catch (error) {
    console.error('Dashboard load error:', error);
  }
}

function displayRecentActivity(activities) {
  const listEl = document.getElementById('recent-activity-list');
  if (!listEl) return;
  
  if (activities.length === 0) {
    listEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">최근 활동이 없습니다</p>';
    return;
  }
  
  listEl.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <span>${activity.description}</span>
      <span class="activity-time">${formatTime(activity.timestamp)}</span>
    </div>
  `).join('');
}

// ========================================
// 탭별 데이터 로드
// ========================================
async function loadTabData(tabName) {
  switch(tabName) {
    case 'overview':
      await loadDashboardData();
      break;
    case 'applications':
      await refreshApplications();
      break;
    case 'users':
      await loadUsers();
      break;
    case 'links':
      await refreshLinks();
      break;
    case 'analytics':
      await loadAnalytics();
      break;
    case 'security':
      await refreshSecurityLogs();
      break;
    case 'settings':
      await loadSettings();
      break;
  }
}

// ========================================
// 지원서 관리
// ========================================
async function refreshApplications() {
  const filter = document.getElementById('app-filter')?.value || 'all';
  const search = document.getElementById('app-search')?.value || '';
  
  try {
    const response = await fetch(`/api/admin/applications?filter=${filter}&search=${encodeURIComponent(search)}`, {
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load applications');
    
    const data = await response.json();
    displayApplications(data.applications || []);
    
  } catch (error) {
    console.error('Applications load error:', error);
    document.getElementById('applications-list').innerHTML = 
      '<p style="color: var(--accent-danger); text-align: center; padding: 20px;">지원서 로드 실패</p>';
  }
}

function displayApplications(applications) {
  const listEl = document.getElementById('applications-list');
  if (!listEl) return;
  
  if (applications.length === 0) {
    listEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">지원서가 없습니다</p>';
    return;
  }
  
  listEl.innerHTML = `
    <div class="table-row table-header">
      <div style="flex: 1">디스코드</div>
      <div style="flex: 1">나이</div>
      <div style="flex: 2">지원 동기</div>
      <div style="flex: 1">상태</div>
      <div style="flex: 1">제출일</div>
      <div style="width: 100px">작업</div>
    </div>
    ${applications.map(app => `
      <div class="table-row">
        <div style="flex: 1">${escapeHtml(app.discord)}</div>
        <div style="flex: 1">${app.age}</div>
        <div style="flex: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(app.reason.substring(0, 50))}...</div>
        <div style="flex: 1">
          <span style="color: ${getStatusColor(app.status)}">${getStatusText(app.status)}</span>
        </div>
        <div style="flex: 1">${formatDate(app.created_at)}</div>
        <div style="width: 100px">
          <button class="btn-secondary" onclick="viewApplication('${app.id}')" style="padding: 4px 8px; font-size: 12px;">상세</button>
        </div>
      </div>
    `).join('')}
  `;
}

function getStatusColor(status) {
  switch(status) {
    case 'pending': return 'var(--accent-warning)';
    case 'approved': return 'var(--accent-success)';
    case 'rejected': return 'var(--accent-danger)';
    default: return 'var(--text-muted)';
  }
}

function getStatusText(status) {
  switch(status) {
    case 'pending': return '대기중';
    case 'approved': return '승인됨';
    case 'rejected': return '거절됨';
    default: return '알 수 없음';
  }
}

function viewApplication(id) {
  // TODO: 지원서 상세 모달 표시
  console.log('View application:', id);
}

// ========================================
// 사용자 관리
// ========================================
async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load users');
    
    const data = await response.json();
    displayUsers(data.users || []);
    
  } catch (error) {
    console.error('Users load error:', error);
  }
}

function displayUsers(users) {
  const listEl = document.getElementById('users-list');
  if (!listEl) return;
  
  if (users.length === 0) {
    listEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">사용자가 없습니다</p>';
    return;
  }
  
  listEl.innerHTML = `
    <div class="table-row table-header">
      <div style="flex: 1">사용자명</div>
      <div style="flex: 1">이메일</div>
      <div style="flex: 1">권한</div>
      <div style="flex: 1">가입일</div>
      <div style="width: 150px">작업</div>
    </div>
    ${users.map(user => `
      <div class="table-row">
        <div style="flex: 1">${escapeHtml(user.username)}</div>
        <div style="flex: 1">${escapeHtml(user.email || 'N/A')}</div>
        <div style="flex: 1">${escapeHtml(user.role)}</div>
        <div style="flex: 1">${formatDate(user.created_at)}</div>
        <div style="width: 150px; display: flex; gap: 4px;">
          <button class="btn-secondary" onclick="editUser('${user.id}')" style="padding: 4px 8px; font-size: 12px;">수정</button>
          <button class="btn-danger" onclick="deleteUser('${user.id}')" style="padding: 4px 8px; font-size: 12px;">삭제</button>
        </div>
      </div>
    `).join('')}
  `;
}

function openAddUserModal() {
  // TODO: 사용자 추가 모달
  alert('사용자 추가 기능 (개발 예정)');
}

function editUser(id) {
  // TODO: 사용자 수정
  console.log('Edit user:', id);
}

function deleteUser(id) {
  if (confirm('정말 이 사용자를 삭제하시겠습니까?')) {
    // TODO: 사용자 삭제 API 호출
    console.log('Delete user:', id);
  }
}

// ========================================
// 단축 URL 관리
// ========================================
async function refreshLinks() {
  const filter = document.getElementById('link-filter')?.value || 'all';
  
  try {
    const response = await fetch(`/api/admin/short-urls?filter=${filter}`, {
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load links');
    
    const data = await response.json();
    displayLinks(data.links || []);
    
  } catch (error) {
    console.error('Links load error:', error);
  }
}

function displayLinks(links) {
  const listEl = document.getElementById('links-list');
  if (!listEl) return;
  
  if (links.length === 0) {
    listEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">단축 URL이 없습니다</p>';
    return;
  }
  
  listEl.innerHTML = `
    <div class="table-row table-header">
      <div style="flex: 1">코드</div>
      <div style="flex: 2">원본 URL</div>
      <div style="flex: 1">조회수</div>
      <div style="flex: 1">만료일</div>
      <div style="width: 100px">작업</div>
    </div>
    ${links.map(link => `
      <div class="table-row">
        <div style="flex: 1"><code>${link.code}</code></div>
        <div style="flex: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(link.url)}</div>
        <div style="flex: 1">${link.clicks || 0}</div>
        <div style="flex: 1">${formatDate(link.expires_at)}</div>
        <div style="width: 100px">
          <button class="btn-danger" onclick="deleteLink('${link.code}')" style="padding: 4px 8px; font-size: 12px;">삭제</button>
        </div>
      </div>
    `).join('')}
  `;
}

function deleteLink(code) {
  if (confirm(`단축 URL "${code}"를 삭제하시겠습니까?`)) {
    // TODO: 삭제 API 호출
    console.log('Delete link:', code);
  }
}

// ========================================
// 접속 통계
// ========================================
async function loadAnalytics() {
  const start = document.getElementById('analytics-start')?.value;
  const end = document.getElementById('analytics-end')?.value;
  
  if (!start || !end) {
    // 기본값: 최근 7일
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    if (document.getElementById('analytics-start')) {
      document.getElementById('analytics-start').value = weekAgo.toISOString().split('T')[0];
    }
    if (document.getElementById('analytics-end')) {
      document.getElementById('analytics-end').value = today.toISOString().split('T')[0];
    }
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/analytics?start=${start}&end=${end}`, {
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load analytics');
    
    const data = await response.json();
    displayAnalytics(data);
    
  } catch (error) {
    console.error('Analytics load error:', error);
  }
}

function displayAnalytics(data) {
  // TODO: 차트 라이브러리 사용 (Chart.js 등)
  document.getElementById('pageview-chart').innerHTML = 
    '<p style="color: var(--text-muted);">차트 데이터 (개발 예정)</p>';
  
  document.getElementById('top-pages').innerHTML = 
    '<p style="color: var(--text-muted);">인기 페이지 데이터 (개발 예정)</p>';
}

// ========================================
// 보안 로그
// ========================================
async function refreshSecurityLogs() {
  const filter = document.getElementById('security-filter')?.value || 'all';
  
  try {
    const response = await fetch(`/api/admin/security-logs?filter=${filter}`, {
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load security logs');
    
    const data = await response.json();
    displaySecurityLogs(data.logs || []);
    
  } catch (error) {
    console.error('Security logs load error:', error);
  }
}

function displaySecurityLogs(logs) {
  const listEl = document.getElementById('security-logs');
  if (!listEl) return;
  
  if (logs.length === 0) {
    listEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">보안 로그가 없습니다</p>';
    return;
  }
  
  listEl.innerHTML = `
    <div class="table-row table-header">
      <div style="flex: 1">시간</div>
      <div style="flex: 1">유형</div>
      <div style="flex: 2">설명</div>
      <div style="flex: 1">IP 주소</div>
    </div>
    ${logs.map(log => `
      <div class="table-row">
        <div style="flex: 1">${formatDateTime(log.timestamp)}</div>
        <div style="flex: 1">
          <span style="color: ${getLogTypeColor(log.type)}">${getLogTypeText(log.type)}</span>
        </div>
        <div style="flex: 2">${escapeHtml(log.description)}</div>
        <div style="flex: 1"><code>${log.ip_address}</code></div>
      </div>
    `).join('')}
  `;
}

function getLogTypeColor(type) {
  switch(type) {
    case 'failed': return 'var(--accent-danger)';
    case 'vpn': return 'var(--accent-warning)';
    case 'suspicious': return 'var(--accent-danger)';
    default: return 'var(--text-primary)';
  }
}

function getLogTypeText(type) {
  switch(type) {
    case 'login': return '로그인';
    case 'failed': return '실패';
    case 'vpn': return 'VPN 차단';
    case 'suspicious': return '의심 활동';
    default: return type;
  }
}

function clearOldLogs() {
  if (confirm('30일 이상 된 보안 로그를 삭제하시겠습니까?')) {
    // TODO: 로그 삭제 API 호출
    alert('로그 삭제 기능 (개발 예정)');
  }
}

// ========================================
// 설정
// ========================================
async function loadSettings() {
  try {
    const response = await fetch('/api/admin/settings', {
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load settings');
    
    const data = await response.json();
    
    // 설정 값 적용
    if (document.getElementById('setting-vpn-block')) {
      document.getElementById('setting-vpn-block').checked = data.vpn_block_enabled !== false;
    }
    if (document.getElementById('setting-rate-limit')) {
      document.getElementById('setting-rate-limit').checked = data.rate_limit_enabled !== false;
    }
    
    // DB 상태
    if (document.getElementById('db-status')) {
      document.getElementById('db-status').textContent = data.db_connected ? '● 연결됨' : '○ 연결 안 됨';
      document.getElementById('db-status').style.color = data.db_connected ? 'var(--accent-success)' : 'var(--accent-danger)';
    }
    
  } catch (error) {
    console.error('Settings load error:', error);
  }
}

async function saveSettings() {
  const settings = {
    vpn_block_enabled: document.getElementById('setting-vpn-block')?.checked,
    rate_limit_enabled: document.getElementById('setting-rate-limit')?.checked
  };
  
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminSession.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) throw new Error('Failed to save settings');
    
    alert('설정이 저장되었습니다');
    
  } catch (error) {
    console.error('Settings save error:', error);
    alert('설정 저장 실패');
  }
}

function backupDatabase() {
  alert('데이터베이스 백업 기능 (개발 예정)');
}

function confirmDatabaseCleanup() {
  if (confirm('정말 오래된 데이터를 정리하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
    alert('데이터 정리 기능 (개발 예정)');
  }
}

function regenerateApiKey() {
  if (confirm('API 키를 재생성하시겠습니까?\n기존 키는 즉시 무효화됩니다.')) {
    alert('API 키 재생성 기능 (개발 예정)');
  }
}

// ========================================
// 유틸리티 함수
// ========================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR');
}

function formatTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  
  return formatDate(dateString);
}

// ========================================
// 보안: 비활성 감지
// ========================================
let inactivityTimer;
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15분

function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  if (adminSession) {
    inactivityTimer = setTimeout(() => {
      logout('비활성 상태로 인해 자동 로그아웃되었습니다');
    }, INACTIVITY_TIMEOUT);
  }
}

// 사용자 활동 감지
['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetInactivityTimer, true);
});

// 초기 타이머 시작
resetInactivityTimer();
