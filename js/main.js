import { supabase } from './supabase-config.js';

const mockCars = [
    { id: 1, name: 'Hyundai H1', plate: 'B 2459 FGW', status: 'Tersedia', type: 'Van', icon: 'bx-bus', colorClass: 'car-color-1' },
    { id: 2, name: 'Toyota Fortuner', plate: 'B 2793 FBE', status: 'Tersedia', type: 'SUV', icon: 'bx-car', colorClass: 'car-color-2' },
    { id: 3, name: 'Isuzu Elf 24', plate: 'B 7324 IR', status: 'Dipakai', type: 'Minibus', icon: 'bx-bus', colorClass: 'car-color-3' },
    { id: 4, name: 'Honda CRV', plate: 'B 1458 SJD', status: 'Tersedia', type: 'SUV', icon: 'bx-car', colorClass: 'car-color-4' },
    { id: 5, name: 'Omoda 5', plate: 'B 1674 FNO', status: 'Tersedia', type: 'SUV', icon: 'bx-car', colorClass: 'car-color-1' },
    { id: 6, name: 'Ambulance', plate: 'B 7818 IR', status: 'Tersedia', type: 'Ambulance', icon: 'bx-plus-medical', colorClass: 'car-color-2' },
];

let selectedCarId = null;
let currentUserSession = null;

document.addEventListener('DOMContentLoaded', async () => {
    const carsGrid = document.getElementById('carsGrid');
    const form = document.getElementById('bookingForm');
    const successModal = document.getElementById('successModal');
    const errorModal = document.getElementById('errorModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeErrorBtn = document.getElementById('closeErrorBtn');
    const errorMessageEl = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');

    // Auth navbar elements
    const navLoginBtn = document.getElementById('navLoginBtn');
    const navUserProfile = document.getElementById('navUserProfile');
    const logoutBtn = document.getElementById('logoutBtn');
    const displayNameEl = document.getElementById('displayName');
    const displayRoleEl = document.getElementById('displayRole');
    const namaPeminjamInput = document.getElementById('namaPeminjam');
    const userHistorySection = document.getElementById('userHistorySection');

    // 1. Check user authentication status
    const { data: { session } } = await supabase.auth.getSession();
    currentUserSession = session;

    if (session) {
        // Logged-in State
        navLoginBtn.style.display = 'none';
        navUserProfile.style.display = 'flex';
        logoutBtn.style.display = 'flex';

        const fullName = session.user.user_metadata?.full_name || session.user.email;
        const role = session.user.user_metadata?.role || 'peminjam';
        
        displayNameEl.textContent = fullName;
        displayRoleEl.textContent = role === 'leader' ? 'Leader' : 'Peminjam';

        // Auto-fill and lock name field
        namaPeminjamInput.value = fullName;
        namaPeminjamInput.setAttribute('readonly', 'true');
        namaPeminjamInput.style.background = '#e2e8f0';
        namaPeminjamInput.style.cursor = 'not-allowed';

        // Show and load user history
        userHistorySection.style.display = 'block';
        await fetchAndRenderUserHistory(session.user.id);
    } else {
        // Guest State
        navLoginBtn.style.display = 'flex';
        navUserProfile.style.display = 'none';
        logoutBtn.style.display = 'none';
        userHistorySection.style.display = 'none';
        
        namaPeminjamInput.value = '';
        namaPeminjamInput.removeAttribute('readonly');
        namaPeminjamInput.style.background = '#f8fafc';
        namaPeminjamInput.style.cursor = 'text';
    }

    // 2. Handle Logout Button
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });

    // 3. Render Cars List
    mockCars.forEach(car => {
        const isAvailable = car.status === 'Tersedia';
        const card = document.createElement('div');
        card.className = `car-card ${isAvailable ? 'available' : 'used'}`;
        card.dataset.id = car.id;
        
        card.innerHTML = `
            <div class="car-header">
                <div class="car-icon-wrapper ${car.colorClass}">
                    <i class='bx ${car.icon}'></i>
                </div>
                <span class="status-badge ${isAvailable ? 'status-avail' : 'status-used'}">${car.status}</span>
            </div>
            <div class="car-details">
                <h3>${car.name}</h3>
                <p>${car.plate}</p>
            </div>
            <i class='bx bxs-check-circle check-icon'></i>
        `;

        if (isAvailable) {
            card.addEventListener('click', () => selectCar(car.id));
        }

        carsGrid.appendChild(card);
    });

    // 4. Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Must be logged in to submit
        if (!currentUserSession) {
            alert('Silakan masuk (Login) atau daftar akun terlebih dahulu untuk melakukan peminjaman mobil!');
            window.location.href = 'login.html';
            return;
        }
        
        if (!selectedCarId) {
            alert('Silakan pilih mobil dari daftar kendaraan terlebih dahulu!');
            return;
        }

        const selectedCar = mockCars.find(c => c.id === selectedCarId);
        const leaderSelect = document.getElementById('leader');
        const [leaderName, leaderEmail] = leaderSelect.value.split('|');
        const namaPeminjam = namaPeminjamInput.value;
        const tanggal = document.getElementById('tanggal').value;
        const jamMulai = document.getElementById('jamMulai').value;
        const jamSelesai = document.getElementById('jamSelesai').value;
        const tujuan = document.getElementById('tujuan').value;
        const keperluan = document.getElementById('keperluan').value;

        // Change submit button state to loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Mengirim... <i class="bx bx-loader-alt bx-spin"></i>';

        try {
            const { data, error } = await supabase
                .from('peminjaman_mobil')
                .insert([
                    {
                        user_id: currentUserSession.user.id,
                        peminjam_nama: namaPeminjam,
                        kendaraan_nama: selectedCar.name,
                        kendaraan_plat: selectedCar.plate,
                        tanggal: tanggal,
                        jam_mulai: jamMulai,
                        jam_selesai: jamSelesai,
                        tujuan: tujuan,
                        keperluan: keperluan,
                        leader_nama: leaderName,
                        leader_email: leaderEmail,
                        status: 'menunggu'
                    }
                ]);

            if (error) throw error;

            document.getElementById('modalCarName').textContent = selectedCar.name;
            document.getElementById('modalLeader').textContent = leaderName;
            
            successModal.classList.add('active');
            
            // Reload history table
            await fetchAndRenderUserHistory(currentUserSession.user.id);
        } catch (error) {
            console.error('Error submitting booking:', error);
            errorMessageEl.textContent = error.message || 'Terjadi kesalahan saat menyimpan data ke Supabase.';
            errorModal.classList.add('active');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Kirim Pengajuan <i class="bx bx-right-arrow-alt"></i>';
        }
    });

    closeModalBtn.addEventListener('click', () => {
        successModal.classList.remove('active');
        form.reset();
        
        // Retain the locked name if logged in
        if (currentUserSession) {
            namaPeminjamInput.value = currentUserSession.user.user_metadata?.full_name || currentUserSession.user.email;
        }

        selectCar(null); // Deselect
    });

    closeErrorBtn.addEventListener('click', () => {
        errorModal.classList.remove('active');
    });
});

function selectCar(id) {
    selectedCarId = id;
    const cards = document.querySelectorAll('.car-card');
    cards.forEach(card => {
        if (card.dataset.id == id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

// 5. Fetch and Render User Booking History
async function fetchAndRenderUserHistory(userId) {
    const userHistoryBody = document.getElementById('userHistoryBody');
    if (!userHistoryBody) return;

    userHistoryBody.innerHTML = `
        <tr>
            <td colspan="5" class="loading-td">
                <i class='bx bx-loader-alt bx-spin'></i> Memuat riwayat peminjaman...
            </td>
        </tr>
    `;

    try {
        const { data: userBookings, error } = await supabase
            .from('peminjaman_mobil')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!userBookings || userBookings.length === 0) {
            userHistoryBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-td">
                        <div class="empty-state">
                            <i class='bx bx-folder-open'></i>
                            <p>Anda belum memiliki riwayat pengajuan peminjaman.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        userHistoryBody.innerHTML = '';
        userBookings.forEach(booking => {
            const tr = document.createElement('tr');
            
            // Format Dates
            const tglDinas = formatDate(booking.tanggal);

            // Badge styling
            let badgeClass = 'badge-menunggu';
            let statusIcon = 'bx-time-five';
            if (booking.status === 'disetujui') {
                badgeClass = 'badge-disetujui';
                statusIcon = 'bx-check-circle';
            } else if (booking.status === 'ditolak') {
                badgeClass = 'badge-ditolak';
                statusIcon = 'bx-x-circle';
            }

            // Catatan Leader
            let catatanHtml = '';
            if (booking.catatan_leader) {
                catatanHtml = `<div class="catatan-leader-box" title="Catatan Leader"><strong>Catatan:</strong> ${booking.catatan_leader}</div>`;
            }

            tr.innerHTML = `
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
                <td data-label="Approver">
                    <div class="leader-cell">
                        ${booking.leader_nama}
                    </div>
                </td>
                <td data-label="Status">
                    <span class="badge-status ${badgeClass}">
                        <i class='bx ${statusIcon}'></i> ${booking.status}
                    </span>
                    ${catatanHtml}
                </td>
            `;

            userHistoryBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading history:', err);
        userHistoryBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-td text-danger">
                    <i class='bx bx-error-circle' style='font-size:2rem;'></i>
                    <p style="margin-top:8px;">Gagal memuat riwayat dari database.</p>
                </td>
            </tr>
        `;
    }
}

// Helpers
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    } catch {
        return dateStr;
    }
}
