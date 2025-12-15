// ========================================
// TERALINK 관리자 대시보드 v1.0.0
// 보안 중심 관리 시스템
// ========================================

// 전역 상태
let adminSession = null;
let sessionStartTime = null;
let sessionTimer = null;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분
let turnstileWidgetId = null;
let turnstileToken = null;

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  checkExistingSession();
  initEventListeners();
  initTurnstile();
});

// Turnstile 명시적 렌더링
function initTurnstile() {
  // Turnstile API 로드 대기
  const checkTurnstile = setInterval(() => {
    if (window.turnstile) {
      clearInterval(checkTurnstile);
      renderTurnstile();
    }
  }, 100);
  
  // 타임아웃 설정 (10초)
  setTimeout(() => {
    clearInterval(checkTurnstile);
    if (!window.turnstile) {
      console.error('Turnstile API failed to load');
      showStatus('보안 캡챠 로드 실패. 페이지를 새로고침 해주세요.', 'error');
    }
  }, 10000);
}

function renderTurnstile() {
  const container = document.getElementById('turnstile-widget');
  if (!container) return;
  
  // 기존 위젯 제거
  if (turnstileWidgetId !== null) {
    try {
      window.turnstile.remove(turnstileWidgetId);
      turnstileWidgetId = null;
    } catch (e) {
      console.warn('Failed to remove existing widget:', e);
    }
  }
  
  // 컨테이너 초기화
  container.innerHTML = '';
  
  try {
    turnstileWidgetId = window.turnstile.render('#turnstile-widget', {
      sitekey: '0x4AAAAAACGiuMFPCm-ky_ah',
      theme: 'dark',
      size: 'normal', // 모바일 호환성을 위해 normal 사용
      callback: function(token) {
        console.log('Turnstile verified:', token);
        turnstileToken = token;
      },
      'error-callback': function() {
        console.error('Turnstile error');
        showStatus('캡챠 검증 오류. 다시 시도해주세요.', 'error');
      },
      'expired-callback': function() {
        console.warn('Turnstile expired');
        if (turnstileWidgetId !== null) {
          window.turnstile.reset(turnstileWidgetId);
        }
      }
    });
    console.log('Turnstile rendered with widget ID:', turnstileWidgetId);
  } catch (error) {
    console.error('Turnstile render error:', error);
    showStatus('캡챠 렌더링 실패. 페이지를 새로고침 해주세요.', 'error');
  }
}

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
  const cfTurnstileResponse = document.querySelector('[name="cf-turnstile-response"]')?.value;
  // 서버로 보낼 토큰은 turnstileToken(명시 렌더링 콜백에서 설정) 또는 폼의 cf-turnstile-response
  const turnstileTokenToSend = turnstileToken || cfTurnstileResponse || null;
  
  const statusEl = document.getElementById('login-status');
  statusEl.textContent = '';
  statusEl.className = 'status-message';
  
  // 검증
  if (!username || !password || !totp) {
    showStatus('모든 필드를 입력해주세요', 'error');
    return;
  }
  
  // Guest 계정은 "guest" 문자열 허용, 일반 계정은 6자리 숫자만
  if (username !== 'guest' && (totp.length !== 6 || !/^\d{6}$/.test(totp))) {
    showStatus('2FA 코드는 6자리 숫자여야 합니다', 'error');
    return;
  }

  /* if (!turnstileTokenToSend) {
    showStatus('보안 검증(캡챠)을 완료해주세요', 'error');
    return;
  } */
  
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
        turnstile_token: turnstileTokenToSend
      })
    });
    
    // 응답 텍스트 먼저 확인
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Response was:', responseText);
      showStatus('서버 응답 형식 오류. 관리자에게 문의하세요.', 'error');
      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }
      return;
    }
    
    if (!response.ok) {
      showStatus(data.error || '로그인 실패', 'error');
      // Turnstile 리셋
      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }
      return;
    }
    
    // 로그인 성공
    adminSession = {
      token: data.token,
      username: data.username,
      role: data.role || 'guest',
      permissions: data.permissions || []
    };
    
    sessionStartTime = Date.now();
    sessionStorage.setItem('admin_session', JSON.stringify(adminSession));
    sessionStorage.setItem('session_start_time', sessionStartTime.toString());
    
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
  const savedStartTime = sessionStorage.getItem('session_start_time');
  
  if (savedSession && savedStartTime) {
    try {
      adminSession = JSON.parse(savedSession);
      sessionStartTime = parseInt(savedStartTime, 10);
      
      // 세션이 아직 유효한지 확인
      const elapsed = Date.now() - sessionStartTime;
      if (elapsed < SESSION_TIMEOUT) {
        showDashboard();
      } else {
        // 세션 만료
        sessionStorage.removeItem('admin_session');
        sessionStorage.removeItem('session_start_time');
      }
    } catch (e) {
      sessionStorage.removeItem('admin_session');
      sessionStorage.removeItem('session_start_time');
    }
  }
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  
  // 관리자 이름 표시
  const displayName = adminSession?.username || 'Admin';
  const roleBadge = adminSession?.role === 'guest' ? ' 🔍 (읽기 전용)' : '';
  document.getElementById('admin-name').textContent = displayName + roleBadge;
  
  // Guest 권한 제한 UI 적용
  applyRoleBasedUI();
  
  // 세션 타이머 시작
  startSessionTimer();
  
  // 대시보드 데이터 로드
  loadDashboardData();
}

// Guest 권한에 따른 UI 제한
function applyRoleBasedUI() {
  if (adminSession?.role === 'guest') {
    // 모든 수정/삭제 버튼 비활성화
    const restrictedButtons = document.querySelectorAll(
      'button[onclick*="delete"], ' +
      'button[onclick*="update"], ' +
      'button[onclick*="save"], ' +
      'button[onclick*="create"], ' +
      'button[onclick*="approve"], ' +
      'button[onclick*="reject"], ' +
      'button[onclick*="backup"], ' +
      'button[onclick*="cleanup"]'
    );
    
    restrictedButtons.forEach(btn => {
      btn.disabled = true;
      btn.title = '읽기 전용 계정은 수정할 수 없습니다';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
    
    // 읽기 전용 안내 배너 추가
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (dashboardHeader && !document.getElementById('readonly-banner')) {
      const banner = document.createElement('div');
      banner.id = 'readonly-banner';
      banner.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 10px 0; border-radius: 5px; color: #856404;';
      banner.innerHTML = '🔍 <strong>읽기 전용 모드</strong>: Guest 계정은 데이터 조회만 가능합니다.';
      dashboardHeader.after(banner);
    }
  }
}

function startSessionTimer() {
  // 새로고침 시에도 기존 sessionStartTime 유지 (checkExistingSession에서 설정됨)
  if (!sessionStartTime) {
    sessionStartTime = Date.now();
    sessionStorage.setItem('session_start_time', sessionStartTime.toString());
  }
  
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
  sessionStorage.removeItem('session_start_time');
  adminSession = null;
  sessionStartTime = null;
  
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  
  // 폼 초기화
  document.getElementById('login-form').reset();
  
  if (message) {
    showStatus(message, 'error');
  }
  
  // Turnstile 리셋
  if (window.turnstile) {
    try {
      window.turnstile.reset();
    } catch (e) {
      // 일부 버전에서는 인자 없이 reset()만 지원할 수 있음 — 예외 무시
      try { window.turnstile.reset(turnstileWidgetId); } catch (e2) {}
    }
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

async function viewApplication(id) {
  try {
    const response = await fetch(`/api/admin/applications?id=${id}`, {
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load application');
    
    const data = await response.json();
    const app = data.applications?.[0];
    
    if (!app) throw new Error('Application not found');
    
    // 모달 표시
    const modalHTML = `
      <div class="modal-overlay" id="app-detail-modal" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
          <div class="modal-header">
            <h2 style="margin: 0;">지원서 상세</h2>
            <button onclick="closeModal()" style="background: none; border: none; color: var(--text-primary); font-size: 24px; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            <div style="display: grid; gap: 16px;">
              <div>
                <label style="color: var(--text-muted); font-size: 14px;">디스코드</label>
                <div style="font-weight: 600; margin-top: 4px;">${escapeHtml(app.discord)}</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="color: var(--text-muted); font-size: 14px;">나이</label>
                  <div style="margin-top: 4px;">${app.age}세</div>
                </div>
                <div>
                  <label style="color: var(--text-muted); font-size: 14px;">활동 시간</label>
                  <div style="margin-top: 4px;">${escapeHtml(app.active_time)}</div>
                </div>
              </div>
              <div>
                <label style="color: var(--text-muted); font-size: 14px;">지원 동기</label>
                <div style="background: var(--bg-secondary); padding: 12px; border-radius: 4px; margin-top: 4px; white-space: pre-wrap;">${escapeHtml(app.reason)}</div>
              </div>
              <div>
                <label style="color: var(--text-muted); font-size: 14px;">해상도</label>
                <div style="margin-top: 4px;">${escapeHtml(app.resolution)}</div>
              </div>
              <div>
                <label style="color: var(--text-muted); font-size: 14px;">운영 경험</label>
                <div style="background: var(--bg-secondary); padding: 12px; border-radius: 4px; margin-top: 4px; white-space: pre-wrap;">${escapeHtml(app.operation_experience)}</div>
              </div>
              <div>
                <label style="color: var(--text-muted); font-size: 14px;">개발 경험</label>
                <div style="background: var(--bg-secondary); padding: 12px; border-radius: 4px; margin-top: 4px; white-space: pre-wrap;">${escapeHtml(app.dev_experience)}</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="color: var(--text-muted); font-size: 14px;">상태</label>
                  <div style="margin-top: 4px;">
                    <span style="color: ${getStatusColor(app.status)}; font-weight: 600;">${getStatusText(app.status)}</span>
                  </div>
                </div>
                <div>
                  <label style="color: var(--text-muted); font-size: 14px;">제출일</label>
                  <div style="margin-top: 4px;">${formatDateTime(app.created_at)}</div>
                </div>
              </div>
              <div>
                <label style="color: var(--text-muted); font-size: 14px;">IP 주소</label>
                <div style="margin-top: 4px;"><code>${app.ip_address || 'N/A'}</code></div>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid var(--border-color);">
            ${app.status === 'pending' ? `
              <button class="btn-success" onclick="updateApplicationStatus('${app.id}', 'approved')">승인</button>
              <button class="btn-danger" onclick="updateApplicationStatus('${app.id}', 'rejected')">거절</button>
            ` : ''}
            <button class="btn-secondary" onclick="closeModal()">닫기</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
  } catch (error) {
    console.error('View application error:', error);
    alert('지원서를 불러오는데 실패했습니다');
  }
}

function closeModal() {
  const modal = document.getElementById('app-detail-modal');
  if (modal) {
    modal.remove();
  }
}

async function updateApplicationStatus(id, status) {
  if (!confirm(`이 지원서를 ${status === 'approved' ? '승인' : '거절'}하시겠습니까?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminSession.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) throw new Error('Failed to update status');
    
    alert('상태가 업데이트되었습니다');
    closeModal();
    refreshApplications();
    
  } catch (error) {
    console.error('Update status error:', error);
    alert('상태 업데이트 실패');
  }
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
  try {
    const response = await fetch('/api/admin/analytics', {
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
  const analyticsContainer = document.querySelector('#tab-analytics .tab-content-inner');
  if (!analyticsContainer) return;
  
  analyticsContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="stat-card" style="background: var(--bg-secondary); padding: 16px; border-radius: 8px;">
        <div style="color: var(--text-muted); font-size: 14px;">오늘 방문</div>
        <div style="font-size: 32px; font-weight: 600; color: var(--accent-primary);">${data.today?.total_visits || 0}</div>
        <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">순 방문자: ${data.today?.unique_visitors || 0}</div>
      </div>
      <div class="stat-card" style="background: var(--bg-secondary); padding: 16px; border-radius: 8px;">
        <div style="color: var(--text-muted); font-size: 14px;">이번 주</div>
        <div style="font-size: 32px; font-weight: 600; color: var(--accent-success);">${data.week?.total_visits || 0}</div>
        <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">순 방문자: ${data.week?.unique_visitors || 0}</div>
      </div>
      <div class="stat-card" style="background: var(--bg-secondary); padding: 16px; border-radius: 8px;">
        <div style="color: var(--text-muted); font-size: 14px;">이번 달</div>
        <div style="font-size: 32px; font-weight: 600; color: var(--accent-info);">${data.month?.total_visits || 0}</div>
        <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">순 방문자: ${data.month?.unique_visitors || 0}</div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
      <div class="card" style="background: var(--bg-secondary); padding: 20px; border-radius: 8px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px;">📊 일별 방문자 추이 (최근 7일)</h3>
        <div style="max-height: 300px; overflow-y: auto;">
          ${(data.daily_visits || []).map(day => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
              <span>${day.date}</span>
              <span style="font-weight: 600; color: var(--accent-primary);">${day.visits} (${day.unique_visitors}명)</span>
            </div>
          `).join('') || '<p style="color: var(--text-muted); text-align: center; padding: 20px;">데이터 없음</p>'}
        </div>
      </div>
      
      <div class="card" style="background: var(--bg-secondary); padding: 20px; border-radius: 8px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px;">🔥 인기 페이지 (최근 7일)</h3>
        <div style="max-height: 300px; overflow-y: auto;">
          ${(data.top_pages || []).map((page, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
              <span style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--text-muted);">#${index + 1}</span>
                <code style="font-size: 12px;">${escapeHtml(page.path)}</code>
              </span>
              <span style="font-weight: 600; color: var(--accent-success);">${page.visits}</span>
            </div>
          `).join('') || '<p style="color: var(--text-muted); text-align: center; padding: 20px;">데이터 없음</p>'}
        </div>
      </div>
      
      <div class="card" style="background: var(--bg-secondary); padding: 20px; border-radius: 8px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px;">📡 HTTP 상태 코드 분포</h3>
        <div style="max-height: 300px; overflow-y: auto;">
          ${(data.status_codes || []).map(status => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
              <span style="font-weight: 600; color: ${getStatusCodeColor(status.status_code)};">${status.status_code}</span>
              <span>${status.count}회</span>
            </div>
          `).join('') || '<p style="color: var(--text-muted); text-align: center; padding: 20px;">데이터 없음</p>'}
        </div>
      </div>
    </div>
  `;
}

function getStatusCodeColor(code) {
  if (code >= 200 && code < 300) return 'var(--accent-success)';
  if (code >= 300 && code < 400) return 'var(--accent-info)';
  if (code >= 400 && code < 500) return 'var(--accent-warning)';
  if (code >= 500) return 'var(--accent-danger)';
  return 'var(--text-primary)';
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

async function backupDatabase() {
  if (!confirm('데이터베이스 전체를 백업하시겠습니까?')) {
    return;
  }
  
  try {
    const response = await fetch('/api/admin/backup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) throw new Error('Backup failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teralink-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    alert('백업이 완료되었습니다');
  } catch (error) {
    console.error('Backup error:', error);
    alert('백업 실패: ' + error.message);
  }
}

async function confirmDatabaseCleanup() {
  if (!confirm('정말 오래된 데이터를 정리하시겠습니까?\n\n삭제 대상:\n- 90일 이상 된 접속 로그\n- 180일 이상 된 보안 로그\n- 만료된 단축 URL (30일 경과)\n\n이 작업은 되돌릴 수 없습니다.')) {
    return;
  }
  
  try {
    const response = await fetch('/api/admin/cleanup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSession.token}`
      }
    });
    
    if (!response.ok) throw new Error('Cleanup failed');
    
    const data = await response.json();
    alert(`데이터 정리 완료:\n- 접속 로그: ${data.deleted_access_logs}개 삭제\n- 보안 로그: ${data.deleted_security_logs}개 삭제\n- 단축 URL: ${data.deleted_urls}개 삭제`);
    
    // 통계 새로고침
    loadSettings();
  } catch (error) {
    console.error('Cleanup error:', error);
    alert('데이터 정리 실패: ' + error.message);
  }
}

function regenerateApiKey() {
  if (confirm('API 키를 재생성하시겠습니까?\n기존 키는 즉시 무효화됩니다.')) {
    const newKey = generateRandomKey(32);
    const apiKeyDisplay = document.querySelector('.api-key-display');
    if (apiKeyDisplay) {
      apiKeyDisplay.textContent = newKey;
      alert('새 API 키가 생성되었습니다.\n안전한 곳에 보관하세요.');
    }
  }
}

function generateRandomKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
