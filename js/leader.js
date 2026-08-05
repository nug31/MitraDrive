import { supabase } from './supabase-config.js';

// Predefined leaders data for self-seeding
const leadersToCreate = [
    { name: "Elis Rika Sugiarti", email: "elis.rika@mitradrive.id", password: "MI2100elis" },
    { name: "Abdul Munir", email: "abdul.munir@mitradrive.id", password: "MI2100munir" },
    { name: "Puspita Sari, S.Pd", email: "puspita.sari@mitradrive.id", password: "MI2100puspita" },
    { name: "Nuryana Fitriyani", email: "nuryana.fitriyani@mitradrive.id", password: "MI2100nuryana" },
    { name: "Ryo Maytana", email: "ryo.maytana@mitradrive.id", password: "MI2100ryo" },
    { name: "Okxy Ixganda", email: "okxy.ixganda@mitradrive.id", password: "MI2100okxy" },
    { name: "Astri Afmi Wulandari", email: "astri.afmi@mitradrive.id", password: "MI2100astri" },
    { name: "Eldha Luvyzha", email: "eldha.luvyzha@mitradrive.id", password: "MI2100eldha" },
    { name: "Kiki Widhia Swara", email: "kiki.widhia@mitradrive.id", password: "MI2100kiki" },
    { name: "Refty Royan", email: "refty.royan@mitradrive.id", password: "MI2100refty" },
    { name: "Abdillah Putra", email: "abdillah.putra@mitradrive.id", password: "MI2100abdillah" },
    { name: "Heru Triatmo", email: "heru.triatmo@mitradrive.id", password: "MI2100heru" }
];

// Admin account
const adminAccount = { name: "Administrator", email: "admin@mitradrive.id", password: "MitraAdmin2100", role: "admin" };

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const bookingTable = document.getElementById('bookingTable');

    if (loginForm) {
        initLoginPage();
    } else if (bookingTable) {
        await initDashboardPage();
    }
});

// ==========================================
// LOGIN PAGE LOGIC
// ==========================================
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    
    // Tab switching elements
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const nameGroup = document.getElementById('nameGroup');
    const fullNameInput = document.getElementById('fullName');
    const emailLabel = document.getElementById('emailLabel');
    const loginSubtitle = document.getElementById('loginSubtitle');

    let currentMode = 'login'; // login | register

    // Tab Event Listeners
    tabLogin.addEventListener('click', () => {
        if (currentMode === 'login') return;
        currentMode = 'login';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        nameGroup.style.display = 'none';
        fullNameInput.removeAttribute('required');
        emailLabel.innerHTML = `<i class='bx bx-envelope text-primary'></i> Email`;
        loginTitle.textContent = "Masuk ke Akun Anda";
        loginSubtitle.textContent = "Silakan masuk untuk mengajukan peminjaman atau menyetujui sebagai leader.";
        loginBtn.innerHTML = `Masuk <i class='bx bx-log-in'></i>`;
    });

    tabRegister.addEventListener('click', () => {
        if (currentMode === 'register') return;
        currentMode = 'register';
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        nameGroup.style.display = 'block';
        fullNameInput.setAttribute('required', 'true');
        emailLabel.innerHTML = `<i class='bx bx-envelope text-primary'></i> Email Peminjam`;
        loginTitle.textContent = "Daftar Akun Peminjam";
        loginSubtitle.textContent = "Buat akun baru untuk mulai meminjam mobil operasional.";
        loginBtn.innerHTML = `Daftar Baru <i class='bx bx-user-plus'></i>`;
    });

    // Toggle Password Visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = togglePassword.querySelector('i');
        icon.className = type === 'password' ? 'bx bx-show' : 'bx bx-hide';
    });

    // Handle Login & Register Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        loginBtn.disabled = true;
        
        if (currentMode === 'login') {
            loginBtn.innerHTML = 'Memproses... <i class="bx bx-loader-alt bx-spin"></i>';
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                // Check role in user metadata and profiles table
                let role = data.user.user_metadata?.role;
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();
                    if (profile && profile.role) {
                        role = profile.role;
                    }
                } catch (e) {
                    console.error('Error fetching profile role:', e);
                }
                
                if (role === 'admin') {
                    showToast('Login Admin berhasil! Mengalihkan...', 'success');
                    setTimeout(() => {
                        window.location.href = 'admin-dashboard.html';
                    }, 1000);
                } else if (role === 'koordinator_tefa') {
                    showToast('Login Koordinator TEFA berhasil! Mengalihkan...', 'success');
                    setTimeout(() => {
                        window.location.href = 'koordinator-dashboard.html';
                    }, 1000);
                } else if (role === 'checker') {
                    showToast('Login Checker berhasil! Mengalihkan...', 'success');
                    setTimeout(() => {
                        window.location.href = 'checker-dashboard.html';
                    }, 1000);
                } else if (role === 'pic_peminjaman') {
                    showToast('Login PIC Peminjaman berhasil! Mengalihkan...', 'success');
                    setTimeout(() => {
                        window.location.href = 'pic-dashboard.html';
                    }, 1000);
                } else if (role === 'leader') {
                    showToast('Login Leader berhasil! Mengalihkan...', 'success');
                    setTimeout(() => {
                        window.location.href = 'leader-dashboard.html';
                    }, 1000);
                } else {
                    showToast('Login berhasil! Mengalihkan...', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            } catch (error) {
                console.error('Login error:', error);
                let message = 'Email atau password salah!';
                if (error.message.includes('Email not confirmed')) {
                    message = 'Email belum dikonfirmasi! Hubungi administrator atau periksa inbox Anda.';
                } else if (error.message) {
                    message = error.message;
                }
                showToast(message, 'error');
                loginBtn.disabled = false;
                loginBtn.innerHTML = `Masuk <i class='bx bx-log-in'></i>`;
            }
        } else {
            // Register Mode
            const fullName = fullNameInput.value.trim();
            loginBtn.innerHTML = 'Mendaftarkan... <i class="bx bx-loader-alt bx-spin"></i>';
            
            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: 'peminjam'
                        }
                    }
                });

                if (error) throw error;

                showToast('Pendaftaran berhasil! Mengalihkan...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);

            } catch (error) {
                console.error('Registration error:', error);
                showToast(error.message || 'Gagal mendaftarkan akun baru.', 'error');
                loginBtn.disabled = false;
                loginBtn.innerHTML = `Daftar Baru <i class='bx bx-user-plus'></i>`;
            }
        }
    });
}

// ==========================================
// DASHBOARD PAGE LOGIC
// ==========================================
let allBookings = [];
let currentLeaderSession = null;

async function initDashboardPage() {
    const leaderNameEl = document.getElementById('leaderName');
    const leaderEmailEl = document.getElementById('leaderEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Search and filters
    const searchInput = document.getElementById('searchInput');
    const filterScope = document.getElementById('filterScope');
    const filterStatus = document.getElementById('filterStatus');

    // Action Modal Elements
    const actionModal = document.getElementById('actionModal');
    const actionForm = document.getElementById('actionForm');
    const btnCancelAction = document.getElementById('btnCancelAction');

    // 1. Check Session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }

    currentLeaderSession = session;
    let fullName = session.user.user_metadata?.full_name || session.user.email;
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();
        if (profile && profile.full_name) {
            fullName = profile.full_name;
        }
    } catch (e) {
        console.error('Error fetching profile name:', e);
    }
    
    leaderNameEl.textContent = fullName;
    leaderEmailEl.textContent = session.user.email;

    // 2. Load Bookings
    await fetchAndRenderBookings();

    // 3. Setup Listeners
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    searchInput.addEventListener('input', filterAndRenderTable);
    filterScope.addEventListener('change', filterAndRenderTable);
    filterStatus.addEventListener('change', filterAndRenderTable);

    btnCancelAction.addEventListener('click', () => {
        actionModal.classList.remove('active');
        actionForm.reset();
    });

    actionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookingId = document.getElementById('actionId').value;
        const statusType = document.getElementById('actionType').value;
        const catatan = document.getElementById('catatan').value.trim();

        const btnConfirm = document.getElementById('btnConfirmAction');
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Menyimpan...';

        try {
            const { error: updateError } = await supabase
                .from('peminjaman_mobil')
                .update({
                    status: statusType,
                    catatan_leader: catatan || null
                })
                .eq('id', bookingId);

            if (updateError) throw updateError;

            showToast(`Pengajuan berhasil ${statusType}!`, 'success');
            actionModal.classList.remove('active');
            actionForm.reset();
            
            // Reload table
            await fetchAndRenderBookings();
        } catch (err) {
            console.error('Error updating status:', err);
            showToast('Gagal memperbarui status pengajuan.', 'error');
        } finally {
            btnConfirm.disabled = false;
            btnConfirm.textContent = 'Konfirmasi';
        }
    });
}

async function fetchAndRenderBookings() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading-td">
                <i class='bx bx-loader-alt bx-spin'></i> Memuat data pengajuan...
            </td>
        </tr>
    `;

    try {
        const { data, error } = await supabase
            .from('peminjaman_mobil')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allBookings = data || [];
        updateStats();
        filterAndRenderTable();
    } catch (err) {
        console.error('Error fetching bookings:', err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-td text-danger">
                    <i class='bx bx-error-circle' style='font-size:2rem;'></i>
                    <p style="margin-top:8px;">Gagal memuat data dari database. Periksa koneksi atau schema tabel Anda.</p>
                </td>
            </tr>
        `;
    }
}

function updateStats() {
    if (!currentLeaderSession) return;
    const myEmail = currentLeaderSession.user.email;
    
    // Filter stats matching scope
    const filterScope = document.getElementById('filterScope').value;
    const relevantBookings = filterScope === 'mine' 
        ? allBookings.filter(b => b.leader_email.toLowerCase() === myEmail.toLowerCase())
        : allBookings;

    const total = relevantBookings.length;
    const pending = relevantBookings.filter(b => b.status === 'menunggu' || b.status === 'menunggu_leader').length;
    const approved = relevantBookings.filter(b => b.status === 'disetujui').length;
    const rejected = relevantBookings.filter(b => b.status === 'ditolak').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statApproved').textContent = approved;
    document.getElementById('statRejected').textContent = rejected;
}

function filterAndRenderTable() {
    const tableBody = document.getElementById('tableBody');
    if (!currentLeaderSession) return;
    const myEmail = currentLeaderSession.user.email;

    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const scopeVal = document.getElementById('filterScope').value;
    const statusVal = document.getElementById('filterStatus').value;

    // Filter by Scope
    let filtered = allBookings;
    if (scopeVal === 'mine') {
        filtered = filtered.filter(b => b.leader_email.toLowerCase() === myEmail.toLowerCase());
    }

    // Filter by Status
    if (statusVal !== 'all') {
        filtered = filtered.filter(b => b.status === statusVal);
    }

    // Filter by Search Query
    if (searchVal) {
        filtered = filtered.filter(b => 
            b.peminjam_nama.toLowerCase().includes(searchVal) ||
            b.kendaraan_nama.toLowerCase().includes(searchVal) ||
            b.tujuan.toLowerCase().includes(searchVal) ||
            b.keperluan.toLowerCase().includes(searchVal) ||
            b.leader_nama.toLowerCase().includes(searchVal)
        );
    }

    // Also update stats if scope changes
    updateStats();

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-td">
                    <div class="empty-state">
                        <i class='bx bx-folder-open'></i>
                        <p>Tidak ada pengajuan peminjaman yang ditemukan.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';
    filtered.forEach(booking => {
        const tr = document.createElement('tr');
        
        // Date formatting
        const tglDinas = formatDate(booking.tanggal);
        const tglBuat = formatDateTime(booking.created_at);

        // Status Badge class
        let badgeClass = 'badge-menunggu';
        let statusIcon = 'bx-time-five';
        let statusText = booking.status;
         if (booking.status === 'menunggu' || booking.status === 'menunggu_leader') {
            badgeClass = 'badge-menunggu';
            statusIcon = 'bx-time-five';
            statusText = 'Menunggu Leader';
        } else if (booking.status === 'menunggu_pic') {
            badgeClass = 'badge-menunggu';
            statusIcon = 'bx-clipboard';
            statusText = 'Menunggu PIC Peminjaman';
        } else if (booking.status === 'menunggu_checker') {
            badgeClass = 'badge-menunggu';
            statusIcon = 'bx-search-alt';
            statusText = 'Menunggu Checker';
        } else if (booking.status === 'menunggu_koordinator') {
            badgeClass = 'badge-menunggu-admin';
            statusIcon = 'bx-star';
            statusText = 'Menunggu Koordinator TEFA';
        } else if (booking.status === 'menunggu_admin') {
            badgeClass = 'badge-menunggu-admin';
            statusIcon = 'bx-time';
            statusText = 'Menunggu Admin';
        } else if (booking.status === 'disetujui') {
            badgeClass = 'badge-disetujui';
            statusIcon = 'bx-check-circle';
            statusText = 'Disetujui';
        } else if (booking.status === 'ditolak') {
            badgeClass = 'badge-ditolak';
            statusIcon = 'bx-x-circle';
            statusText = 'Ditolak';
        }

        // Actions cell
        let actionsHtml = '';
        if ((booking.status === 'menunggu' || booking.status === 'menunggu_leader') && booking.leader_email.toLowerCase() === myEmail.toLowerCase()) {
            actionsHtml = `
                <div class="action-buttons" style="display:flex; flex-direction:column; gap:4px;">
                    <div style="display:flex; gap:4px;">
                        <button class="btn-approve" data-id="${booking.id}" title="Setujui">
                            <i class='bx bx-check'></i> Setujui
                        </button>
                        <button class="btn-reject" data-id="${booking.id}" title="Tolak">
                            <i class='bx bx-x'></i> Tolak
                        </button>
                    </div>
                    <button onclick="openOfficialFormModal('${booking.id}')" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; cursor:pointer; font-weight:600; display:flex; align-items:center; justify-content:center; gap:4px;">
                        <i class='bx bx-file'></i> Lihat Form
                    </button>
                </div>
            `;
        } else {
            actionsHtml = `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-size:0.85rem; color:var(--text-muted);">Diproses</span>
                    <button onclick="openOfficialFormModal('${booking.id}')" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; cursor:pointer; font-weight:600; display:flex; align-items:center; justify-content:center; gap:4px;">
                        <i class='bx bx-file'></i> Lihat Form
                    </button>
                </div>
            `;
        }

        // Notes HTML
        let catatanHtml = '';
        if (booking.catatan_leader) {
            catatanHtml = `<div class="catatan-leader-box" title="Catatan Leader"><strong>Catatan:</strong> ${booking.catatan_leader}</div>`;
        }

        tr.innerHTML = `
            <td data-label="Peminjam">
                <div class="peminjam-cell">
                    <span class="nama">${booking.peminjam_nama}</span>
                    <span class="tanggal">Dibuat: ${tglBuat}</span>
                </div>
            </td>
            <td data-label="Kendaraan">
                <div class="kendaraan-cell">
                    <span class="nama">${booking.kendaraan_nama}</span>
                    <span class="plat">${booking.kendaraan_plat}</span>
                </div>
            </td>
            <td data-label="Rencana">
                <div class="rencana-cell">
                    <span class="tanggal-dinas">${tglDinas}</span>
                    <span class="jam"><i class='bx bx-time-five'></i> ${booking.jam_mulai} - ${booking.jam_selesai}</span>
                </div>
            </td>
            <td data-label="Tujuan">
                <div class="tujuan-cell">
                    <div class="lokasi">${booking.tujuan}</div>
                    <div class="keperluan" style="margin-bottom:8px;">${booking.keperluan}</div>
                    <div style="font-size: 0.8rem; color: #475569; background: #f1f5f9; padding: 6px; border-radius: 6px;">
                        <div style="margin-bottom: 2px;"><strong>Driver:</strong> ${booking.driver_nama || booking.peminjam_nama}</div>
                        <div style="margin-bottom: 2px;"><strong>Penumpang:</strong> ${booking.penumpang || '-'}</div>
                        <div style="margin-bottom: 2px;"><strong>KM Awal:</strong> ${booking.km_awal || '-'} | <strong>Bensin:</strong> ${booking.bensin_awal || 'F'}</div>
                        <div><strong>E-Toll:</strong> ${booking.request_etoll || 'Tidak'} ${booking.saldo_etoll_awal ? `(${booking.saldo_etoll_awal})` : ''}</div>
                    </div>
                </div>
            </td>
            <td data-label="Leader">
                <div class="leader-cell">
                    ${booking.leader_nama}
                </div>
            </td>
            <td data-label="Status">
                <span class="badge-status ${badgeClass}">
                    <i class='bx ${statusIcon}'></i> ${statusText}
                </span>
                ${catatanHtml}
            </td>
            <td data-label="Aksi">
                ${actionsHtml}
            </td>
        `;

        // Add action button events
        const approveBtn = tr.querySelector('.btn-approve');
        const rejectBtn = tr.querySelector('.btn-reject');

        if (approveBtn) {
            approveBtn.addEventListener('click', () => openActionModal(booking.id, 'menunggu_koordinator'));
        }
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => openActionModal(booking.id, 'ditolak'));
        }

        tableBody.appendChild(tr);
    });
}

// Official Form Replica Modal Handler for Leader Panel
window.openOfficialFormModal = function(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
        showToast('Data pengajuan tidak ditemukan', 'error');
        return;
    }

    const officialFormModal = document.getElementById('officialFormModal');
    const container = document.getElementById('officialFormContent');
    const closeBtn = document.getElementById('closeOfficialFormBtn');

    if (closeBtn) {
        closeBtn.onclick = () => officialFormModal.classList.remove('active');
    }

    if (container) {
        const bensinAwal = booking.bensin_awal || 'F';
        const bensinAkhir = booking.bensin_akhir || booking.sisa_bensin || '-';
        const kmAwal = booking.km_awal ? `${booking.km_awal} KM` : '-';
        const kmAkhir = booking.km_akhir ? `${booking.km_akhir} KM` : '-';
        const driver = booking.driver_nama || booking.peminjam_nama;
        const penumpang = booking.penumpang || '-';
        const reqEtoll = booking.request_etoll || (booking.sisa_etol ? 'Ya' : 'Tidak');
        const saldoEtollAwal = booking.saldo_etoll_awal || '-';
        const saldoEtollAkhir = booking.saldo_etoll_akhir || booking.sisa_etol || '-';
        const abnormaliti = booking.catatan_abnormaliti || booking.kondisi_mobil || 'Tidak ada abnormaliti yang dilaporkan.';

        let statusLeaderText = 'Pending';
        let statusLeaderColor = '#64748b';
        const leaderDone = ['menunggu_koordinator','menunggu_admin','disetujui','selesai'].includes(booking.status);
        if (leaderDone) { statusLeaderText = '✓ Disetujui'; statusLeaderColor = '#16a34a'; }
        else if (booking.status === 'ditolak') { statusLeaderText = '✗ Ditolak'; statusLeaderColor = '#ea580c'; }

        const picDone = ['menunggu_checker','menunggu_leader','menunggu_koordinator','menunggu_admin','disetujui','selesai'].includes(booking.status);
        const picText = picDone ? '✓ Disetujui' : 'Pending';
        const picColor = picDone ? '#16a34a' : '#64748b';
        const checkerDone = ['menunggu_leader','menunggu_koordinator','menunggu_admin','disetujui','selesai'].includes(booking.status);
        const checkerText = checkerDone ? '✓ Disetujui' : 'Pending';
        const checkerColor = checkerDone ? '#16a34a' : '#64748b';
        const koordinatorDone = ['disetujui','selesai'].includes(booking.status);
        const koordinatorText = koordinatorDone ? '✓ Disetujui' : 'Pending';
        const koordinatorColor = koordinatorDone ? '#16a34a' : '#64748b';

        const fuelAngles = { 'E': -90, '1/4': -45, '1/2': 0, '3/4': 45, 'F': 90 };
        function getSvg(level) {
            const angle = fuelAngles[level] !== undefined ? fuelAngles[level] : 90;
            return `
                <svg viewBox="0 0 100 55" style="width: 75px; height: 42px; overflow: visible;">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#cbd5e1" stroke-width="7" stroke-linecap="round" />
                    <path d="M 10 50 A 40 40 0 0 1 21.72 21.72" fill="none" stroke="#ef4444" stroke-width="7" />
                    <path d="M 21.72 21.72 A 40 40 0 0 1 50 10" fill="none" stroke="#f97316" stroke-width="7" />
                    <path d="M 50 10 A 40 40 0 0 1 78.28 21.72" fill="none" stroke="#eab308" stroke-width="7" />
                    <path d="M 78.28 21.72 A 40 40 0 0 1 90 50" fill="none" stroke="#22c55e" stroke-width="7" />
                    <circle cx="10" cy="50" r="3.5" fill="#ef4444" />
                    <circle cx="90" cy="50" r="3.5" fill="#22c55e" />
                    <text x="7" y="54" font-size="7" font-weight="bold" fill="#334155">E</text>
                    <text x="87" y="54" font-size="7" font-weight="bold" fill="#334155">F</text>
                    <g transform="rotate(${angle} 50 50)">
                        <line x1="50" y1="50" x2="50" y2="16" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
                        <circle cx="50" cy="50" r="4.5" fill="#0f172a" />
                    </g>
                </svg>
            `;
        }

        container.innerHTML = `
            <div class="of-header">
                <div class="of-logo-area">
                    <div style="width:48px; height:48px; background:linear-gradient(135deg, #f97316, #fbbf24); border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.6rem;">
                        <i class='bx bx-car'></i>
                    </div>
                    <div>
                        <div style="font-size:0.75rem; font-weight:800; color:#f97316; letter-spacing:1px;">SMK MITRA INDUSTRI MM2100</div>
                        <div style="font-size:0.65rem; color:#64748b;">Kawasan Industri MM2100 Cikarang</div>
                    </div>
                </div>
                <div class="of-title-area">
                    <h2>FORM PEMINJAMAN MOBIL OPERASIONAL</h2>
                    <h3>SMK MITRA INDUSTRI MM2100</h3>
                </div>
                <div class="of-car-icon">
                    <i class='bx bx-car'></i>
                </div>
            </div>

            <table class="of-table">
                <thead>
                    <tr>
                        <th style="width: 14%;">Tanggal Pinjam</th>
                        <th style="width: 18%;">Nama Peminjam</th>
                        <th style="width: 16%;">Unit Mobil</th>
                        <th style="width: 26%;">Keperluan & Tujuan</th>
                        <th style="width: 13%;">KM Awal</th>
                        <th style="width: 13%;">KM Akhir</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${formatDate(booking.tanggal)}</strong></td>
                        <td><strong>${booking.peminjam_nama}</strong></td>
                        <td>${booking.kendaraan_nama}<br><span style="font-size:0.75rem; color:#64748b;">${booking.kendaraan_plat}</span></td>
                        <td style="text-align:left;"><strong>Tujuan:</strong> ${booking.tujuan}<br><strong>Keperluan:</strong> ${booking.keperluan}</td>
                        <td>${kmAwal}</td>
                        <td>${kmAkhir}</td>
                    </tr>
                </tbody>
            </table>

            <table class="of-table">
                <thead>
                    <tr>
                        <th style="width: 11%;">Jam Pinjam</th>
                        <th style="width: 11%;">Jam Kembali</th>
                        <th style="width: 16%;">Bensin Awal</th>
                        <th style="width: 16%;">Bensin Akhir</th>
                        <th style="width: 14%;">Driver</th>
                        <th style="width: 14%;">Penumpang</th>
                        <th style="width: 18%;">Request E-Toll</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${booking.jam_mulai}</td>
                        <td>${booking.jam_selesai}</td>
                        <td>
                            <div class="of-fuel-dial-wrapper">
                                ${getSvg(bensinAwal)}
                                <span style="font-size:0.72rem; font-weight:700;">Level: ${bensinAwal}</span>
                            </div>
                        </td>
                        <td>
                            <div class="of-fuel-dial-wrapper">
                                ${bensinAkhir !== '-' ? getSvg(bensinAkhir) : '<span style="color:#94a3b8;">-</span>'}
                                <span style="font-size:0.72rem; font-weight:700;">Level: ${bensinAkhir}</span>
                            </div>
                        </td>
                        <td>${driver}</td>
                        <td>${penumpang}</td>
                        <td style="text-align:left; font-size:0.75rem;">
                            <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                                <span style="padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.65rem; background:${reqEtoll==='Ya'?'#dcfce7':'#f1f5f9'}; color:${reqEtoll==='Ya'?'#15803d':'#475569'};">
                                    ${reqEtoll==='Ya'?'YES':'NO'}
                                </span>
                            </div>
                            <div><strong>Saldo Awal:</strong> ${saldoEtollAwal}</div>
                            <div><strong>Saldo Akhir:</strong> ${saldoEtollAkhir}</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="of-abnormality-box">
                <div class="of-abnormality-title"><i class='bx bx-error-circle'></i> CATATAN ABNORMALITI:</div>
                <div class="of-abnormality-content">
                    ${abnormaliti}
                </div>
            </div>

            <table class="of-signatures-table">
                <thead>
                    <tr>
                        <th style="width:20%;">TTD PIC PEMINJAMAN</th>
                        <th style="width:20%;">TTD CHECKER</th>
                        <th style="width:20%;">TTD DIRECT LEADER</th>
                        <th style="width:20%;">KOORDINATOR TEFA</th>
                        <th style="width:20%;">TTD PEMINJAM</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div style="font-weight:bold; color:${picColor}; font-size:0.75rem;">${picText}</div>
                            <div style="font-weight:600;">(Enggar Fata)</div>
                            <div style="font-size:0.7rem; color:#64748b;">${picDone ? 'tgl ' + formatDate(booking.pic_approved_at || booking.tanggal) : 'tgl .../.../20...'}</div>
                        </td>
                        <td>
                            <div style="font-weight:bold; color:${checkerColor}; font-size:0.75rem;">${checkerText}</div>
                            <div style="font-weight:600;">(Hanif)</div>
                            <div style="font-size:0.7rem; color:#64748b;">${checkerDone ? 'tgl ' + formatDate(booking.checker_approved_at || booking.tanggal) : 'tgl .../.../20...'}</div>
                        </td>
                        <td>
                            <div style="font-weight:bold; color:${statusLeaderColor}; font-size:0.75rem;">${statusLeaderText}</div>
                            <div style="font-weight:600;">(${booking.leader_nama})</div>
                            <div style="font-size:0.7rem; color:#64748b;">${leaderDone ? 'tgl ' + formatDate(booking.leader_approved_at || booking.tanggal) : 'tgl .../.../20...'}</div>
                        </td>
                        <td>
                            <div style="font-weight:bold; color:${koordinatorColor}; font-size:0.75rem;">${koordinatorText}</div>
                            <div style="font-weight:600;">(Aprilia Rahayu)</div>
                            <div style="font-size:0.7rem; color:#64748b;">${koordinatorDone ? 'tgl ' + formatDate(booking.koordinator_approved_at || booking.tanggal) : 'tgl .../.../20...'}</div>
                        </td>
                        <td>
                            <div style="font-weight:600;">(${booking.peminjam_nama})</div>
                            <div>tgl ${formatDate(booking.tanggal)}</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    officialFormModal.classList.add('active');
};


function openActionModal(id, type) {
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('actionTitle');
    const subtitle = document.getElementById('actionSubtitle');
    const iconWrapper = document.getElementById('actionIcon');
    const btnConfirm = document.getElementById('btnConfirmAction');
    
    document.getElementById('actionId').value = id;
    document.getElementById('actionType').value = type;

    if (type === 'menunggu_koordinator') {
        title.textContent = 'Setujui Pengajuan';
        subtitle.textContent = 'Konfirmasi persetujuan untuk peminjaman unit mobil ini. Pengajuan akan diteruskan ke Koordinator TEFA.';
        iconWrapper.className = 'action-icon-wrapper icon-approve';
        iconWrapper.innerHTML = "<i class='bx bx-check-circle'></i>";
        btnConfirm.className = 'btn-confirm confirm-approve';
        btnConfirm.textContent = 'Setujui';
    } else {
        title.textContent = 'Tolak Pengajuan';
        subtitle.textContent = 'Apakah Anda yakin ingin menolak peminjaman unit mobil ini?';
        iconWrapper.className = 'action-icon-wrapper icon-reject';
        iconWrapper.innerHTML = "<i class='bx bx-x-circle'></i>";
        btnConfirm.className = 'btn-confirm confirm-reject';
        btnConfirm.textContent = 'Tolak';
    }

    modal.classList.add('active');
}

// ==========================================
// TOAST NOTIFICATION HELPERS
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('loginToast') || document.getElementById('dashboardToast');
    if (!toast) return;

    const toastMessage = toast.querySelector('#toastMessage') || toast.querySelector('span');
    const toastIcon = toast.querySelector('.toast-icon');

    toastMessage.textContent = message;
    
    // Style adjustments
    if (type === 'success') {
        toastIcon.className = 'bx bx-check-circle toast-icon text-success';
        toast.style.borderLeft = '4px solid #16a34a';
    } else {
        toastIcon.className = 'bx bx-error-circle toast-icon text-danger';
        toast.style.borderLeft = '4px solid #ef4444';
    }

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ==========================================
// FORMATTING HELPERS
// ==========================================
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    } catch {
        return dateStr;
    }
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    try {
        const date = new Date(dateTimeStr);
        const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options).replace(',', '');
    } catch {
        return dateTimeStr;
    }
}
