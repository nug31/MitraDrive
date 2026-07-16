import { supabase } from './supabase-config.js';

const mockCars = [
    { id: 1, name: 'Hyundai H1', plate: 'B 2459 FGW', status: 'Tersedia', type: 'Van', icon: 'bx-bus', colorClass: 'car-color-1' },
    { id: 2, name: 'Toyota Fortuner', plate: 'B 2793 FBE', status: 'Tersedia', type: 'SUV', icon: 'bx-car', colorClass: 'car-color-2' },
    { id: 3, name: 'Isuzu Elf 24', plate: 'B 7324 IR', status: 'Tersedia', type: 'Minibus', icon: 'bx-bus', colorClass: 'car-color-3' },
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

        // 1.5 Fetch profile from Supabase profiles table if available
        let role = session.user.user_metadata?.role || 'peminjam';
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
        
        displayNameEl.textContent = fullName;
        
        let displayRole = 'Peminjam';
        if (role === 'admin') displayRole = 'Admin';
        else if (role === 'leader') displayRole = 'Leader';
        
        displayRoleEl.textContent = displayRole;

        // Auto-fill and lock name field
        namaPeminjamInput.value = fullName;
        namaPeminjamInput.setAttribute('readonly', 'true');
        namaPeminjamInput.style.background = '#e2e8f0';
        namaPeminjamInput.style.cursor = 'not-allowed';
        
        // Add link to respective dashboard if admin/leader
        const existingLink = document.getElementById('dashboardLinkBtn');
        if (!existingLink && (role === 'admin' || role === 'leader')) {
            const dashboardLink = document.createElement('a');
            dashboardLink.id = 'dashboardLinkBtn';
            dashboardLink.href = role === 'admin' ? 'admin-dashboard.html' : 'leader-dashboard.html';
            dashboardLink.className = 'btn-leader-login';
            dashboardLink.innerHTML = role === 'admin' ? "<i class='bx bx-shield'></i> Panel Admin" : "<i class='bx bx-check-shield'></i> Panel Leader";
            dashboardLink.style.display = 'flex';
            dashboardLink.style.marginRight = '15px';
            document.getElementById('navRight').insertBefore(dashboardLink, navUserProfile);
        }

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

    // 3. Fetch Active Bookings and Render Cars
    async function fetchAndRenderCars() {
        carsGrid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--text-muted);">
                <i class='bx bx-loader-alt bx-spin' style="font-size: 2rem;"></i>
                <p>Memuat status kendaraan...</p>
            </div>
        `;

        try {
            // Fetch bookings that are 'disetujui' or 'menunggu' for today or future
            const todayStr = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('peminjaman_mobil')
                .select('kendaraan_nama, peminjam_nama, status')
                .gte('tanggal', todayStr)
                .in('status', ['disetujui', 'menunggu']);

            if (!error && data) {
                // Reset all cars to available first (in case of re-render)
                mockCars.forEach(c => { c.status = 'Tersedia'; c.borrower = null; });
                
                data.forEach(booking => {
                    const car = mockCars.find(c => c.name === booking.kendaraan_nama);
                    if (car) {
                        if (booking.status !== 'selesai') {
                            car.status = 'Dipakai';
                            car.borrower = booking.peminjam_nama;
                            car.bookingStatus = booking.status; // 'disetujui' or 'menunggu'
                        }
                    }
                });
            }
        } catch (e) {
            console.error('Failed to fetch active bookings', e);
        }

        carsGrid.innerHTML = '';
        mockCars.forEach(car => {
            const isAvailable = car.status === 'Tersedia';
            const card = document.createElement('div');
            card.className = `car-card ${isAvailable ? 'available' : 'used'}`;
            card.dataset.id = car.id;
            
            let borrowerHtml = '';
            if (!isAvailable && car.borrower) {
                const statusText = car.bookingStatus === 'menunggu' ? '(Menunggu)' : '';
                borrowerHtml = `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">
                    <i class='bx bx-user'></i> Dipinjam oleh: <strong>${car.borrower}</strong> ${statusText}
                </div>`;
            }

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
                    ${borrowerHtml}
                </div>
                <i class='bx bxs-check-circle check-icon'></i>
            `;

            if (isAvailable) {
                card.addEventListener('click', () => selectCar(car.id));
            }

            carsGrid.appendChild(card);
        });
    }

    await fetchAndRenderCars();

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
                        status: 'menunggu_leader'
                    }
                ]);

            if (error) throw error;

            document.getElementById('modalCarName').textContent = selectedCar.name;
            document.getElementById('modalLeader').textContent = leaderName;
            
            successModal.classList.add('active');
            
            // Reload history table & cars
            await fetchAndRenderUserHistory(currentUserSession.user.id);
            await fetchAndRenderCars();
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
            let fullName = currentUserSession.user.user_metadata?.full_name || currentUserSession.user.email;
            supabase.from('profiles').select('full_name').eq('id', currentUserSession.user.id).single().then(({data}) => {
                if (data && data.full_name) {
                    namaPeminjamInput.value = data.full_name;
                }
            });
            namaPeminjamInput.value = fullName;
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
            let statusText = booking.status;
            
            if (booking.status === 'menunggu_leader') {
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
                        <i class='bx ${statusIcon}'></i> ${statusText}
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
