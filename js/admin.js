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

    // Fetch from profiles table to ensure consistency with DB edits
    let role = session.user.user_metadata?.role;
    let fullName = session.user.user_metadata?.full_name || session.user.email;
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', session.user.id)
            .single();
        if (profile) {
            role = profile.role || role;
            fullName = profile.full_name || fullName;
        }
    } catch (e) {
        console.error('Failed to load profile', e);
    }

    // Verify Admin Role
    if (role !== 'admin') {
        alert('Akses Ditolak. Halaman ini khusus untuk Administrator.');
        window.location.href = role === 'leader' ? 'leader-dashboard.html' : 'index.html';
        return;
    }

    currentAdminSession = session;
    
    // Set Profile Info
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

    // Export Excel Button
    const btnExportExcel = document.getElementById('btnExportExcel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', exportToExcel);
    }

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
    const pending = allBookings.filter(b => b.status === 'menunggu_admin');
    const approved = allBookings.filter(b => b.status === 'disetujui' || b.status === 'selesai').length;
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
        if (booking.status === 'menunggu_admin') {
            actionsHtml = `
                <div class="action-buttons">
                    <button class="btn-approve" onclick="openAdminAction('${booking.id}', 'disetujui')" title="Setujui Akhir">
                        <i class='bx bx-check'></i>
                    </button>
                    <button class="btn-reject" onclick="openAdminAction('${booking.id}', 'ditolak')" title="Tolak">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
            `;
        } else if (booking.status === 'menunggu' || booking.status === 'menunggu_leader') {
            actionsHtml = `
                <div class="action-buttons">
                    <button class="btn-approve" onclick="openAdminAction('${booking.id}', 'disetujui')" title="Force Setujui (Bypass Leader)">
                        <i class='bx bx-check'></i>
                    </button>
                    <button class="btn-reject" onclick="openAdminAction('${booking.id}', 'ditolak')" title="Force Tolak">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
            `;
        } else if (booking.status === 'disetujui') {
            actionsHtml = `
                <div class="action-buttons">
                    <button class="btn-selesai" onclick="openAdminAction('${booking.id}', 'selesai')" title="Tandai Selesai / Dikembalikan">
                        <i class='bx bx-check-double'></i> Selesai
                    </button>
                    <button class="btn-revert" onclick="openAdminAction('${booking.id}', 'menunggu_leader')" title="Kembalikan ke Menunggu Leader">
                        <i class='bx bx-undo'></i> Reset
                    </button>
                </div>
            `;
        } else {
            actionsHtml = `
                <div class="action-buttons">
                    <button class="btn-revert" onclick="openAdminAction('${booking.id}', 'menunggu_admin')" title="Kembalikan ke Menunggu Admin">
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
        btnConfirm.style.background = ''; // Reset inline background
        btnConfirm.textContent = 'Setujui Force';
    } else if (type === 'ditolak') {
        title.textContent = 'Tolak Pengajuan (Admin)';
        subtitle.textContent = 'Tolak pengajuan secara paksa sebagai Admin.';
        iconWrapper.className = 'action-icon-wrapper icon-reject';
        iconWrapper.innerHTML = "<i class='bx bx-x-circle'></i>";
        btnConfirm.className = 'btn-confirm confirm-reject';
        btnConfirm.style.background = ''; // Reset inline background
        btnConfirm.textContent = 'Tolak Force';
    } else if (type === 'selesai') {
        title.textContent = 'Mobil Dikembalikan (Selesai)';
        subtitle.textContent = 'Tandai bahwa kendaraan ini telah dikembalikan dan tersedia lagi.';
        iconWrapper.className = 'action-icon-wrapper text-primary';
        iconWrapper.style.background = '#eff6ff';
        iconWrapper.innerHTML = "<i class='bx bx-check-double'></i>";
        btnConfirm.className = 'btn-confirm confirm-approve';
        btnConfirm.style.background = '#f97316'; // Use primary brand color (orange)
        btnConfirm.textContent = 'Tandai Selesai';
    } else if (type === 'menunggu_leader' || type === 'menunggu_admin' || type === 'menunggu') {
        title.textContent = 'Reset Status Pengajuan';
        subtitle.textContent = `Kembalikan status pengajuan menjadi "${type === 'menunggu_admin' ? 'Menunggu Admin' : 'Menunggu Leader'}" (akan bisa direview ulang).`;
        iconWrapper.className = 'action-icon-wrapper text-primary';
        iconWrapper.style.background = '#eff6ff';
        iconWrapper.innerHTML = "<i class='bx bx-undo'></i>";
        btnConfirm.className = 'btn-confirm confirm-approve';
        btnConfirm.style.background = ''; // Reset inline background
        btnConfirm.textContent = 'Reset Status';
    }

    modal.classList.add('active');
}

// ==========================================
// HELPERS
// ==========================================
function getBadgeClass(status) {
    if (status === 'disetujui') return 'badge-disetujui';
    if (status === 'selesai') return 'badge-disetujui'; // Re-use green color
    if (status === 'ditolak') return 'badge-ditolak';
    if (status === 'menunggu_admin') return 'badge-menunggu-admin';
    return 'badge-menunggu';
}

function getStatusIcon(status) {
    if (status === 'disetujui') return 'bx-check-circle';
    if (status === 'selesai') return 'bx-check-double';
    if (status === 'ditolak') return 'bx-x-circle';
    if (status === 'menunggu_admin') return 'bx-time';
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
    }, 3000);
}

// ==========================================
// EXPORT TO EXCEL
// ==========================================
function exportToExcel() {
    if (allBookings.length === 0) {
        showToast('Tidak ada data untuk diexport', 'error');
        return;
    }

    // Prepare data for Excel
    const dataToExport = allBookings.map(b => ({
        'ID Pengajuan': b.id,
        'Nama Peminjam': b.peminjam_nama,
        'Driver': b.driver_nama || b.peminjam_nama,
        'Penumpang': b.penumpang || '-',
        'Kendaraan': b.kendaraan_nama,
        'Plat Nomor': b.kendaraan_plat,
        'Tanggal Dinas': formatDate(b.tanggal),
        'Jam Mulai': b.jam_mulai,
        'Jam Selesai': b.jam_selesai,
        'KM Awal': b.km_awal || '-',
        'KM Akhir': b.km_akhir || '-',
        'Bensin Awal': b.bensin_awal || 'F',
        'Bensin Akhir': b.bensin_akhir || b.sisa_bensin || '-',
        'Request E-Toll': b.request_etoll || 'Tidak',
        'Saldo E-Toll Awal': b.saldo_etoll_awal || '-',
        'Saldo E-Toll Akhir': b.saldo_etoll_akhir || b.sisa_etol || '-',
        'Catatan Abnormaliti': b.catatan_abnormaliti || b.kondisi_mobil || '-',
        'Tujuan': b.tujuan,
        'Keperluan': b.keperluan,
        'Nama Approver': b.leader_nama,
        'Status': b.status,
        'Catatan Leader': b.catatan_leader || '',
        'Tanggal Dibuat': formatDate(b.created_at, true)
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    const colWidths = [
        { wch: 38 }, // ID
        { wch: 20 }, // Nama Peminjam
        { wch: 20 }, // Driver
        { wch: 25 }, // Penumpang
        { wch: 20 }, // Kendaraan
        { wch: 15 }, // Plat
        { wch: 15 }, // Tanggal Dinas
        { wch: 12 }, // Jam Mulai
        { wch: 12 }, // Jam Selesai
        { wch: 12 }, // KM Awal
        { wch: 12 }, // KM Akhir
        { wch: 14 }, // Bensin Awal
        { wch: 14 }, // Bensin Akhir
        { wch: 14 }, // Req Etoll
        { wch: 16 }, // Saldo Etoll Awal
        { wch: 16 }, // Saldo Etoll Akhir
        { wch: 35 }, // Catatan Abnormaliti
        { wch: 30 }, // Tujuan
        { wch: 40 }, // Keperluan
        { wch: 20 }, // Nama Approver
        { wch: 15 }, // Status
        { wch: 30 }, // Catatan Leader
        { wch: 20 }, // Tanggal Dibuat
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Rekapan Peminjaman");
    XLSX.writeFile(wb, `Rekapan_Peminjaman_MitraDrive_${new Date().getTime()}.xlsx`);
    showToast('Berhasil mendownload Excel!', 'success');
}

// Official Paper Form Replica Modal Handler for Admin Panel
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
        if (booking.status === 'disetujui' || booking.status === 'selesai') {
            statusLeaderText = '✓ Disetujui';
        } else if (booking.status === 'ditolak') {
            statusLeaderText = '✗ Ditolak';
        }

        const fuelAngles = { 'E': -90, '1/4': -45, '1/2': 0, '3/4': 45, 'F': 90 };
        function getSvg(level) {
            const angle = fuelAngles[level] !== undefined ? fuelAngles[level] : 90;
            return `
                <svg viewBox="0 0 100 55" style="width: 75px; height: 42px;">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#cbd5e1" stroke-width="7" stroke-linecap="round" />
                    <path d="M 10 50 A 40 40 0 0 1 30 21" fill="none" stroke="#ef4444" stroke-width="7" />
                    <path d="M 30 21 A 40 40 0 0 1 50 10" fill="none" stroke="#f97316" stroke-width="7" />
                    <path d="M 50 10 A 40 40 0 0 1 70 21" fill="none" stroke="#eab308" stroke-width="7" />
                    <path d="M 70 21 A 40 40 0 0 1 90 50" fill="none" stroke="#22c55e" stroke-width="7" stroke-linecap="round" />
                    <text x="7" y="54" font-size="7" font-weight="bold" fill="#334155">E</text>
                    <text x="87" y="54" font-size="7" font-weight="bold" fill="#334155">F</text>
                    <g transform="rotate(${angle} 50 50)">
                        <line x1="50" y1="50" x2="16" y2="50" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
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
                        <th style="width:20%;">KOORDINATOR TEFA</th>
                        <th style="width:20%;">TTD DIRECT LEADER</th>
                        <th style="width:20%;">TTD CHECKER</th>
                        <th style="width:20%;">TTD PIC PEMINJAMAN</th>
                        <th style="width:20%;">TTD PEMINJAM</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div style="font-size:0.65rem; color:#64748b;">(.........................)</div>
                            <div>tgl .../.../20...</div>
                        </td>
                        <td>
                            <div style="font-weight:bold; color:${booking.status==='disetujui'||booking.status==='selesai'?'#16a34a':'#ea580c'}; font-size:0.75rem;">
                                ${statusLeaderText}
                            </div>
                            <div style="font-weight:600;">(${booking.leader_nama})</div>
                        </td>
                        <td>
                            <div style="font-size:0.65rem; color:#64748b;">(.........................)</div>
                            <div>tgl .../.../20...</div>
                        </td>
                        <td>
                            <div style="font-weight:600;">( Admin GA / PIC )</div>
                            <div>tgl ${formatDate(booking.tanggal)}</div>
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
