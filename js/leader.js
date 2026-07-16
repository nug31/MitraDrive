import { supabase } from './supabase-config.js';

// Predefined leaders data for self-seeding
const leadersToCreate = [
    { name: "Elis Rika Sugiarti", email: "elis.rika@mitradrive.id", password: "MI2100elis" },
    { name: "Abdul Munir", email: "abdul.munir@mitradrive.id", password: "MI2100munir" },
    { name: "Hidayat Atori", email: "hidayat.atori@mitradrive.id", password: "MI2100hidayat" },
    { name: "Nuryana Fitriyani", email: "nuryana.fitriyani@mitradrive.id", password: "MI2100nuryana" },
    { name: "Aprilia Rahayu Wilujeng", email: "aprilia.rahayu@mitradrive.id", password: "MI2100aprilia" },
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
                <div class="action-buttons">
                    <button class="btn-approve" data-id="${booking.id}" title="Setujui">
                        <i class='bx bx-check'></i>
                    </button>
                    <button class="btn-reject" data-id="${booking.id}" title="Tolak">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
            `;
        } else {
            actionsHtml = `<span style="font-size:0.85rem; color:var(--text-muted);">Tidak ada aksi</span>`;
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
                    <div class="keperluan">${booking.keperluan}</div>
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
            approveBtn.addEventListener('click', () => openActionModal(booking.id, 'menunggu_admin'));
        }
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => openActionModal(booking.id, 'ditolak'));
        }

        tableBody.appendChild(tr);
    });
}

function openActionModal(id, type) {
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('actionTitle');
    const subtitle = document.getElementById('actionSubtitle');
    const iconWrapper = document.getElementById('actionIcon');
    const btnConfirm = document.getElementById('btnConfirmAction');
    
    document.getElementById('actionId').value = id;
    document.getElementById('actionType').value = type;

    if (type === 'menunggu_admin') {
        title.textContent = 'Setujui Pengajuan';
        subtitle.textContent = 'Konfirmasi persetujuan untuk peminjaman unit mobil ini. Pengajuan akan diteruskan ke Admin.';
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
