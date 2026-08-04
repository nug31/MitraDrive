import { supabase } from './supabase-config.js';

let allBookings = [];
let currentSession = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }

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

    if (role !== 'koordinator_tefa' && role !== 'admin') {
        alert('Akses ditolak. Halaman ini khusus untuk Koordinator TEFA.');
        window.location.href = 'index.html';
        return;
    }

    currentSession = session;
    document.getElementById('koordinatorName').textContent = fullName;
    document.getElementById('koordinatorEmail').textContent = session.user.email;

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    document.getElementById('searchInput').addEventListener('input', filterAndRender);
    document.getElementById('filterStatus').addEventListener('change', filterAndRender);

    const actionModal = document.getElementById('actionModal');
    const actionForm = document.getElementById('actionForm');
    document.getElementById('btnCancelAction').addEventListener('click', () => {
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
            const updatePayload = {
                status: statusType,
                catatan_koordinator: catatan || null,
                status_koordinator: statusType === 'ditolak' ? 'ditolak' : 'disetujui',
                koordinator_approved_at: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('peminjaman_mobil')
                .update(updatePayload)
                .eq('id', bookingId);

            if (updateError) throw updateError;

            showToast(`Pengajuan berhasil ${statusType === 'ditolak' ? 'ditolak' : 'disetujui secara final'}!`, 'success');
            actionModal.classList.remove('active');
            actionForm.reset();
            await loadBookings();
        } catch (err) {
            console.error('Error updating status:', err);
            showToast('Gagal memperbarui status pengajuan.', 'error');
        } finally {
            btnConfirm.disabled = false;
            btnConfirm.textContent = 'Konfirmasi';
        }
    });

    await loadBookings();
});

async function loadBookings() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `<tr><td colspan="7" class="loading-td"><i class='bx bx-loader-alt bx-spin'></i> Memuat data...</td></tr>`;

    try {
        const { data, error } = await supabase
            .from('peminjaman_mobil')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allBookings = data || [];
        updateStats();
        filterAndRender();
    } catch (err) {
        console.error('Error fetching bookings:', err);
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-td text-danger"><i class='bx bx-error-circle' style='font-size:2rem;'></i><p>Gagal memuat data.</p></td></tr>`;
    }
}

function updateStats() {
    const pending = allBookings.filter(b => b.status === 'menunggu_koordinator').length;
    const approved = allBookings.filter(b => ['disetujui','selesai'].includes(b.status)).length;
    const rejected = allBookings.filter(b => b.status === 'ditolak').length;

    document.getElementById('statTotal').textContent = allBookings.length;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statApproved').textContent = approved;
    document.getElementById('statRejected').textContent = rejected;
}

function filterAndRender() {
    const tableBody = document.getElementById('tableBody');
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const statusVal = document.getElementById('filterStatus').value;

    let filtered = allBookings;
    if (statusVal !== 'all') {
        filtered = filtered.filter(b => b.status === statusVal);
    }
    if (searchVal) {
        filtered = filtered.filter(b =>
            (b.peminjam_nama || '').toLowerCase().includes(searchVal) ||
            (b.kendaraan_nama || '').toLowerCase().includes(searchVal) ||
            (b.tujuan || '').toLowerCase().includes(searchVal)
        );
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-td"><div class="empty-state"><i class='bx bx-folder-open'></i><p>Tidak ada data ditemukan.</p></div></td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    filtered.forEach(booking => {
        const tr = document.createElement('tr');
        const tglDinas = formatDate(booking.tanggal);
        const tglBuat = formatDateTime(booking.created_at);
        const { badgeClass, statusIcon, statusText } = getStatusDisplay(booking.status);

        let actionsHtml = '';
        if (booking.status === 'menunggu_koordinator') {
            actionsHtml = `
                <div class="action-buttons" style="display:flex; flex-direction:column; gap:4px;">
                    <div style="display:flex; gap:4px;">
                        <button class="btn-approve" data-id="${booking.id}" title="Setujui Secara Final">
                            <i class='bx bx-check-double'></i> Setujui
                        </button>
                        <button class="btn-reject" data-id="${booking.id}" title="Tolak">
                            <i class='bx bx-x'></i> Tolak
                        </button>
                    </div>
                </div>
            `;
        } else {
            actionsHtml = `<span style="font-size:0.85rem; color:var(--text-muted);">Telah Diproses</span>`;
        }

        let catatanHtml = '';
        if (booking.catatan_koordinator) {
            catatanHtml = `<div class="catatan-leader-box" title="Catatan Koordinator TEFA"><strong>Catatan:</strong> ${booking.catatan_koordinator}</div>`;
        }

        tr.innerHTML = `
            <td data-label="Peminjam"><div class="peminjam-cell"><span class="nama">${booking.peminjam_nama}</span><span class="tanggal">Dibuat: ${tglBuat}</span></div></td>
            <td data-label="Kendaraan"><div class="kendaraan-cell"><span class="nama">${booking.kendaraan_nama}</span><span class="plat">${booking.kendaraan_plat}</span></div></td>
            <td data-label="Rencana"><div class="rencana-cell"><span class="tanggal-dinas">${tglDinas}</span><span class="jam"><i class='bx bx-time-five'></i> ${booking.jam_mulai} - ${booking.jam_selesai}</span></div></td>
            <td data-label="Tujuan"><div class="tujuan-cell"><div class="lokasi">${booking.tujuan}</div><div class="keperluan">${booking.keperluan}</div></div></td>
            <td data-label="Leader"><div class="leader-cell">${booking.leader_nama}</div></td>
            <td data-label="Status"><span class="badge-status ${badgeClass}"><i class='bx ${statusIcon}'></i> ${statusText}</span>${catatanHtml}</td>
            <td data-label="Aksi">${actionsHtml}</td>
        `;

        const approveBtn = tr.querySelector('.btn-approve');
        const rejectBtn = tr.querySelector('.btn-reject');
        if (approveBtn) approveBtn.addEventListener('click', () => openActionModal(booking.id, 'disetujui'));
        if (rejectBtn) rejectBtn.addEventListener('click', () => openActionModal(booking.id, 'ditolak'));

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

    if (type === 'disetujui') {
        title.textContent = 'Setujui Pengajuan';
        subtitle.textContent = 'Pengajuan akan DISETUJUI SECARA FINAL. Pengguna dapat mulai menggunakan kendaraan.';
        iconWrapper.className = 'action-icon-wrapper icon-approve';
        iconWrapper.innerHTML = "<i class='bx bx-check-circle'></i>";
        btnConfirm.className = 'btn-confirm confirm-approve';
        btnConfirm.textContent = 'Setujui Final';
    } else {
        title.textContent = 'Tolak Pengajuan';
        subtitle.textContent = 'Apakah Anda yakin ingin menolak peminjaman ini?';
        iconWrapper.className = 'action-icon-wrapper icon-reject';
        iconWrapper.innerHTML = "<i class='bx bx-x-circle'></i>";
        btnConfirm.className = 'btn-confirm confirm-reject';
        btnConfirm.textContent = 'Tolak';
    }
    modal.classList.add('active');
}

function getStatusDisplay(status) {
    const map = {
        'menunggu_pic':         { badgeClass: 'badge-menunggu', statusIcon: 'bx-clipboard', statusText: 'Menunggu PIC' },
        'menunggu_checker':     { badgeClass: 'badge-menunggu', statusIcon: 'bx-search-alt', statusText: 'Menunggu Checker' },
        'menunggu_leader':      { badgeClass: 'badge-menunggu', statusIcon: 'bx-time-five', statusText: 'Menunggu Leader' },
        'menunggu_koordinator': { badgeClass: 'badge-menunggu-admin', statusIcon: 'bx-star', statusText: 'Menunggu Koordinator' },
        'menunggu_admin':       { badgeClass: 'badge-menunggu-admin', statusIcon: 'bx-time', statusText: 'Menunggu Admin' },
        'disetujui':            { badgeClass: 'badge-disetujui', statusIcon: 'bx-check-circle', statusText: 'Disetujui' },
        'ditolak':              { badgeClass: 'badge-ditolak', statusIcon: 'bx-x-circle', statusText: 'Ditolak' },
        'selesai':              { badgeClass: 'badge-disetujui', statusIcon: 'bx-check-double', statusText: 'Selesai' },
    };
    return map[status] || { badgeClass: 'badge-menunggu', statusIcon: 'bx-time-five', statusText: status };
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('dashboardToast');
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
    setTimeout(() => { toast.classList.remove('show'); }, 4000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    try {
        return new Date(dateTimeStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    } catch { return dateTimeStr; }
}
