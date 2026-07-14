import { supabase } from './supabase-config.js';

let allBookings = [];
let currentAdminSession = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check Session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }

    // Verify Admin Role
    const role = session.user.user_metadata?.role;
    if (role !== 'admin') {
        alert('Akses Ditolak. Halaman ini khusus untuk Administrator.');
        window.location.href = role === 'leader' ? 'leader-dashboard.html' : 'index.html';
        return;
    }

    currentAdminSession = session;
    
    // Set Profile Info
    const fullName = session.user.user_metadata?.full_name || session.user.email;
    document.getElementById('adminName').textContent = fullName;
    document.getElementById('adminEmail').textContent = session.user.email;

    // Navigation setup
    setupNavigation();
    
    // UI setup
    setupModals();
    setupFilters();
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });
    
    // Refresh Button
    const btnRefresh = document.getElementById('btnRefresh');
    btnRefresh.addEventListener('click', async () => {
        btnRefresh.classList.add('spinning');
        await loadAllBookings();
        btnRefresh.classList.remove('spinning');
    });

    // Load Data
    await loadAllBookings();
});

// ==========================================
// NAVIGATION HANDLING
// ==========================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.admin-page');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    // Sidebar toggle (mobile)
    const sidebar = document.getElementById('adminSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebar.classList.toggle('collapsed');
    });

    // Page mapping titles
    const titleMap = {
        'overview': { title: 'Overview Dashboard', subtitle: 'Ringkasan seluruh aktivitas peminjaman' },
        'bookings': { title: 'Semua Pengajuan', subtitle: 'Daftar lengkap histori peminjaman' },
        'approved': { title: 'Pengajuan Disetujui', subtitle: 'Daftar peminjaman yang telah disetujui' },
        'rejected': { title: 'Pengajuan Ditolak', subtitle: 'Daftar peminjaman yang ditolak' }
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPageId = item.getAttribute('data-page');
            
            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            // Update active page
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(`page${targetPageId.charAt(0).toUpperCase() + targetPageId.slice(1)}`).classList.add('active');
            
            // Update titles
            const meta = titleMap[targetPageId];
            if (meta) {
                pageTitle.textContent = meta.title;
                pageSubtitle.textContent = meta.subtitle;
            }

            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('open');
            }
        });
    });
}

// ==========================================
// DATA LOADING & RENDERING
// ==========================================
async function loadAllBookings() {
    try {
        const { data, error } = await supabase
            .from('peminjaman_mobil')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allBookings = data || [];
        
        // Update Timestamp
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('lastUpdated').textContent = `Diperbarui: ${timeStr}`;
        
        updateStatsAndBadges();
        updateLeaderDropdown();
        renderAllTables();
        
    } catch (err) {
        console.error('Error fetching admin data:', err);
        showToast('Gagal memuat data dari database!', 'error');
    }
}

function updateStatsAndBadges() {
    const total = allBookings.length;
    const pending = allBookings.filter(b => b.status === 'menunggu');
    const approved = allBookings.filter(b => b.status === 'disetujui').length;
    const rejected = allBookings.filter(b => b.status === 'ditolak').length;

    // Top Stats
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending.length;
    document.getElementById('statApproved').textContent = approved;
    document.getElementById('statRejected').textContent = rejected;

    // Badges & Counters
    document.getElementById('pendingBadge').textContent = pending.length;
    document.getElementById('pendingBadge').style.display = pending.length > 0 ? 'inline-block' : 'none';
    
    document.getElementById('urgentCount').textContent = `${pending.length} perlu tindakan`;
    
    // Quick View Pending Table (Max 5)
    renderPendingQuickView(pending.slice(0, 5));
}

function updateLeaderDropdown() {
    const leaderSelect = document.getElementById('filterAllLeader');
    
    // Get unique leaders
    const leaders = [...new Set(allBookings.map(b => b.leader_nama))].filter(Boolean);
    
    // Keep the "Semua Approver" option
    leaderSelect.innerHTML = '<option value="all">Semua Approver</option>';
    
    leaders.sort().forEach(leader => {
        const option = document.createElement('option');
        option.value = leader;
        option.textContent = leader;
        leaderSelect.appendChild(option);
    });
}

// ==========================================
// FILTERING
// ==========================================
function setupFilters() {
    const searchInput = document.getElementById('searchAllInput');
    const filterStatus = document.getElementById('filterAllStatus');
    const filterLeader = document.getElementById('filterAllLeader');

    const triggerFilter = () => renderMainTable();

    searchInput.addEventListener('input', triggerFilter);
    filterStatus.addEventListener('change', triggerFilter);
    filterLeader.addEventListener('change', triggerFilter);
}

function renderAllTables() {
    renderMainTable();
    renderFilteredTable('disetujui', 'approvedBody');
    renderFilteredTable('ditolak', 'rejectedBody');
}

// ==========================================
// RENDERERS
// ==========================================
function renderPendingQuickView(pendingBookings) {
    const tbody = document.getElementById('pendingTableBody');
    
    if (pendingBookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-td">Tidak ada pengajuan yang menunggu persetujuan.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    pendingBookings.forEach(booking => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>
                <div class="peminjam-cell">
                    <span class="nama">${booking.peminjam_nama}</span>
                </div>
            </td>
            <td>
                <div class="kendaraan-cell">
                    <span class="nama">${booking.kendaraan_nama}</span>
                    <span class="plat">${booking.kendaraan_plat}</span>
                </div>
            </td>
            <td>
                <span class="rencana-cell">
                    <span class="tanggal-dinas">${formatDate(booking.tanggal)}</span>
                </span>
            </td>
            <td>${booking.leader_nama}</td>
            <td>${formatDate(booking.created_at, true)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-approve" onclick="openAdminAction('${booking.id}', 'disetujui')" title="Setujui">
                        <i class='bx bx-check'></i>
                    </button>
                    <button class="btn-reject" onclick="openAdminAction('${booking.id}', 'ditolak')" title="Tolak">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMainTable() {
    const tbody = document.getElementById('allBookingsBody');
    
    const searchVal = document.getElementById('searchAllInput').value.toLowerCase();
    const statusVal = document.getElementById('filterAllStatus').value;
    const leaderVal = document.getElementById('filterAllLeader').value;

    let filtered = allBookings;

    // Filters
    if (statusVal !== 'all') {
        filtered = filtered.filter(b => b.status === statusVal);
    }
    if (leaderVal !== 'all') {
        filtered = filtered.filter(b => b.leader_nama === leaderVal);
    }
    if (searchVal) {
        filtered = filtered.filter(b => 
            (b.peminjam_nama || '').toLowerCase().includes(searchVal) ||
            (b.kendaraan_nama || '').toLowerCase().includes(searchVal) ||
            (b.tujuan || '').toLowerCase().includes(searchVal)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-td">Data tidak ditemukan.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    filtered.forEach(booking => {
        const tr = document.createElement('tr');
        
        const badgeClass = getBadgeClass(booking.status);
        const statusIcon = getStatusIcon(booking.status);

        let actionsHtml = '';
        if (booking.status === 'menunggu') {
            actionsHtml = `
                <div class="action-buttons">
                    <button class="btn-approve" onclick="openAdminAction('${booking.id}', 'disetujui')" title="Setujui">
                        <i class='bx bx-check'></i>
                    </button>
                    <button class="btn-reject" onclick="openAdminAction('${booking.id}', 'ditolak')" title="Tolak">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
            `;
        } else {
            actionsHtml = `
                <div class="action-buttons">
                    <button class="btn-revert" onclick="openAdminAction('${booking.id}', 'menunggu')" title="Kembalikan ke Menunggu">
                        <i class='bx bx-undo'></i> Reset
                    </button>
                </div>
            `;
        }

        tr.innerHTML = `
            <td data-label="Peminjam">
                <div class="peminjam-cell">
                    <span class="nama">${booking.peminjam_nama}</span>
                    <span class="tanggal">Tgl Buat: ${formatDate(booking.created_at, true)}</span>
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
                    <span class="tanggal-dinas">${formatDate(booking.tanggal)}</span>
                    <span class="jam"><i class='bx bx-time-five'></i> ${booking.jam_mulai} - ${booking.jam_selesai}</span>
                </div>
            </td>
            <td data-label="Tujuan">
                <div class="tujuan-cell">
                    <div class="lokasi">${booking.tujuan}</div>
                    <div class="keperluan">${booking.keperluan}</div>
                </div>
            </td>
            <td data-label="Approver">
                <div class="leader-cell">${booking.leader_nama}</div>
            </td>
            <td data-label="Status">
                <span class="badge-status ${badgeClass}">
                    <i class='bx ${statusIcon}'></i> ${booking.status}
                </span>
                ${booking.catatan_leader ? `<div class="catatan-label mt-1">"${booking.catatan_leader}"</div>` : ''}
            </td>
            <td data-label="Aksi Admin">
                ${actionsHtml}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderFilteredTable(statusFilter, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const filtered = allBookings.filter(b => b.status === statusFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-td">Belum ada pengajuan yang ${statusFilter}.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    filtered.forEach(booking => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td data-label="Peminjam">
                <div class="peminjam-cell">
                    <span class="nama">${booking.peminjam_nama}</span>
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
                    <span class="tanggal-dinas">${formatDate(booking.tanggal)}</span>
                </div>
            </td>
            <td data-label="Tujuan">
                <div class="tujuan-cell">
                    <div class="lokasi">${booking.tujuan}</div>
                </div>
            </td>
            <td data-label="Approver">
                <div class="leader-cell">${booking.leader_nama}</div>
            </td>
            <td data-label="Catatan">
                <span class="catatan-label">${booking.catatan_leader || '-'}</span>
            </td>
            <td data-label="Aksi">
                <button class="btn-revert" onclick="openAdminAction('${booking.id}', 'menunggu')" title="Reset Status">
                    <i class='bx bx-undo'></i> Reset
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// ==========================================
// MODAL & ACTIONS
// ==========================================
function setupModals() {
    const modal = document.getElementById('actionModal');
    const form = document.getElementById('actionForm');
    const btnCancel = document.getElementById('btnCancelAction');

    btnCancel.addEventListener('click', () => {
        modal.classList.remove('active');
        form.reset();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookingId = document.getElementById('actionId').value;
        const targetType = document.getElementById('actionType').value; // disetujui, ditolak, menunggu
        const catatan = document.getElementById('catatan').value.trim();
        
        const btnConfirm = document.getElementById('btnConfirmAction');
        const originalText = btnConfirm.textContent;
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Menyimpan...';

        try {
            const updatePayload = {
                status: targetType,
                catatan_leader: catatan || null
            };

            const { error } = await supabase
                .from('peminjaman_mobil')
                .update(updatePayload)
                .eq('id', bookingId);

            if (error) throw error;

            showToast(`Pengajuan berhasil di-set ke: ${targetType}`, 'success');
            modal.classList.remove('active');
            form.reset();
            
            // Reload table data
            await loadAllBookings();
            
        } catch (err) {
            console.error('Error updating as admin:', err);
            showToast('Gagal mengubah status pengajuan.', 'error');
        } finally {
            btnConfirm.disabled = false;
            btnConfirm.textContent = originalText;
        }
    });
}

// Make accessible to inline onclick handlers
window.openAdminAction = function(id, type) {
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('actionTitle');
    const subtitle = document.getElementById('actionSubtitle');
    const iconWrapper = document.getElementById('actionIcon');
    const btnConfirm = document.getElementById('btnConfirmAction');
    const preview = document.getElementById('bookingPreview');
    const catatanArea = document.getElementById('catatan');
    
    document.getElementById('actionId').value = id;
    document.getElementById('actionType').value = type;

    // Find booking details for preview
    const booking = allBookings.find(b => b.id === id);
    if (booking) {
        preview.classList.add('visible');
        preview.innerHTML = `
            <div class="booking-preview-row"><span class="label">Peminjam</span><span class="value">${booking.peminjam_nama}</span></div>
            <div class="booking-preview-row"><span class="label">Mobil</span><span class="value">${booking.kendaraan_nama} (${booking.kendaraan_plat})</span></div>
            <div class="booking-preview-row"><span class="label">Tujuan</span><span class="value">${booking.tujuan}</span></div>
        `;
        // Pre-fill catatan if it exists
        catatanArea.value = booking.catatan_leader || '';
    }

    if (type === 'disetujui') {
        title.textContent = 'Setujui Pengajuan (Admin)';
        subtitle.textContent = 'Setujui pengajuan secara paksa sebagai Admin.';
        iconWrapper.className = 'action-icon-wrapper icon-approve';
        iconWrapper.innerHTML = "<i class='bx bx-check-circle'></i>";
        btnConfirm.className = 'btn-confirm confirm-approve';
        btnConfirm.textContent = 'Setujui Force';
    } else if (type === 'ditolak') {
        title.textContent = 'Tolak Pengajuan (Admin)';
        subtitle.textContent = 'Tolak pengajuan secara paksa sebagai Admin.';
        iconWrapper.className = 'action-icon-wrapper icon-reject';
        iconWrapper.innerHTML = "<i class='bx bx-x-circle'></i>";
        btnConfirm.className = 'btn-confirm confirm-reject';
        btnConfirm.textContent = 'Tolak Force';
    } else if (type === 'menunggu') {
        title.textContent = 'Reset Status Pengajuan';
        subtitle.textContent = 'Kembalikan status pengajuan menjadi "Menunggu" (akan bisa direview ulang oleh leader).';
        iconWrapper.className = 'action-icon-wrapper text-primary';
        iconWrapper.style.background = '#eff6ff';
        iconWrapper.innerHTML = "<i class='bx bx-undo'></i>";
        btnConfirm.className = 'btn-confirm confirm-approve';
        btnConfirm.textContent = 'Reset Status';
    }

    modal.classList.add('active');
}

// ==========================================
// HELPERS
// ==========================================
function getBadgeClass(status) {
    if (status === 'disetujui') return 'badge-disetujui';
    if (status === 'ditolak') return 'badge-ditolak';
    return 'badge-menunggu';
}

function getStatusIcon(status) {
    if (status === 'disetujui') return 'bx-check-circle';
    if (status === 'ditolak') return 'bx-x-circle';
    return 'bx-time-five';
}

function formatDate(dateStr, includeTime = false) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        let formatted = date.toLocaleDateString('id-ID', options);
        
        if (includeTime) {
            formatted += ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
        return formatted;
    } catch {
        return dateStr;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('adminToast');
    if (!toast) return;

    const toastMessage = toast.querySelector('#toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');

    toastMessage.textContent = message;
    
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
