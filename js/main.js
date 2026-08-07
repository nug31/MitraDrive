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
        else if (role === 'koordinator_tefa') displayRole = 'Koordinator TEFA';
        else if (role === 'checker') displayRole = 'Checker';
        else if (role === 'pic_peminjaman') displayRole = 'PIC Peminjaman';
        
        displayRoleEl.textContent = displayRole;

        // Auto-fill and lock name field
        namaPeminjamInput.value = fullName;
        namaPeminjamInput.setAttribute('readonly', 'true');
        namaPeminjamInput.style.background = '#e2e8f0';
        namaPeminjamInput.style.cursor = 'not-allowed';
        
        // Add link to respective dashboard if admin/leader
        const existingLink = document.getElementById('dashboardLinkBtn');
        const dashboardRoles = ['admin', 'leader', 'koordinator_tefa', 'checker', 'pic_peminjaman'];
        if (!existingLink && dashboardRoles.includes(role)) {
            const dashboardLink = document.createElement('a');
            dashboardLink.id = 'dashboardLinkBtn';
            const dashboardHref = {
                admin: 'admin-dashboard.html',
                leader: 'leader-dashboard.html',
                koordinator_tefa: 'koordinator-dashboard.html',
                checker: 'checker-dashboard.html',
                pic_peminjaman: 'pic-dashboard.html'
            };
            const dashboardLabel = {
                admin: "<i class='bx bx-shield'></i> Panel Admin",
                leader: "<i class='bx bx-check-shield'></i> Panel Leader",
                koordinator_tefa: "<i class='bx bx-star'></i> Panel Koordinator",
                checker: "<i class='bx bx-search-alt'></i> Panel Checker",
                pic_peminjaman: "<i class='bx bx-clipboard'></i> Panel PIC"
            };
            dashboardLink.href = dashboardHref[role] || 'index.html';
            dashboardLink.className = 'btn-leader-login';
            dashboardLink.innerHTML = dashboardLabel[role] || '';
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
            // Fetch bookings that are 'disetujui' or 'menunggu' for the selected date
            const tanggalInput = document.getElementById('tanggal');
            const targetDate = (tanggalInput && tanggalInput.value) ? tanggalInput.value : new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('peminjaman_mobil')
                .select('kendaraan_nama, peminjam_nama, status')
                .eq('tanggal', targetDate)
                .in('status', ['disetujui', 'menunggu', 'menunggu_pic', 'menunggu_checker', 'menunggu_leader', 'menunggu_koordinator', 'menunggu_admin']);

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

    const tanggalInputEl = document.getElementById('tanggal');
    if (tanggalInputEl) {
        tanggalInputEl.addEventListener('change', async () => {
            selectedCarId = null;
            await fetchAndRenderCars();
        });
    }

    // Request E-Toll Toggle Listener
    const requestEtollSelect = document.getElementById('requestEtoll');
    const saldoEtollAwalGroup = document.getElementById('saldoEtollAwalGroup');
    if (requestEtollSelect && saldoEtollAwalGroup) {
        requestEtollSelect.addEventListener('change', (e) => {
            if (e.target.value === 'Ya') {
                saldoEtollAwalGroup.style.display = 'block';
            } else {
                saldoEtollAwalGroup.style.display = 'none';
                document.getElementById('saldoEtollAwal').value = '';
            }
        });
    }

    // Interactive Fuel Gauge Selector Logic Helper
    const fuelAngles = { 'E': -90, '1/4': -45, '1/2': 0, '3/4': 45, 'F': 90 };
    const fuelLabels = {
        'E': { text: 'Hampir Habis (E)', color: '#ef4444' },
        '1/4': { text: '1/4 Tangki', color: '#f97316' },
        '1/2': { text: '1/2 Tangki', color: '#eab308' },
        '3/4': { text: '3/4 Tangki', color: '#84cc16' },
        'F': { text: 'Penuh (Full / F)', color: '#22c55e' }
    };

    function setupFuelSelector(buttonsContainerId, needleId, inputId, labelId) {
        const container = document.getElementById(buttonsContainerId);
        if (!container) return;
        const buttons = container.querySelectorAll('.btn-fuel-opt');
        const needle = document.getElementById(needleId);
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = btn.dataset.level;
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (input) input.value = level;
                if (needle && fuelAngles[level] !== undefined) {
                    needle.setAttribute('transform', `rotate(${fuelAngles[level]} 50 50)`);
                }
                if (label && fuelLabels[level]) {
                    label.textContent = fuelLabels[level].text;
                    label.style.color = fuelLabels[level].color;
                }
            });
        });
    }

    setupFuelSelector('fuelButtonsAwal', 'needleGroupAwal', 'bensinAwal', 'labelBensinAwal');
    setupFuelSelector('fuelButtonsAkhir', 'needleGroupAkhir', 'bensinAkhir', 'labelBensinAkhir');

    // 4. Form Submit (Pengajuan Peminjaman Baru)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

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

        // New inspection fields
        const driverNama = document.getElementById('driverNama').value.trim();
        const penumpang = document.getElementById('penumpang').value.trim();
        const kmAwal = document.getElementById('kmAwal').value.trim();
        const bensinAwal = document.getElementById('bensinAwal').value || 'F';
        const requestEtoll = document.getElementById('requestEtoll').value || 'Tidak';
        const saldoEtollAwal = document.getElementById('saldoEtollAwal').value.trim();

        if (!driverNama) { alert('Silakan isi Nama Driver / Pengemudi!'); return; }
        if (!penumpang) { alert('Silakan isi Daftar Penumpang (atau isi "-" jika tidak ada)!'); return; }
        if (!kmAwal) { alert('Silakan isi KM Awal (Odometer)!'); return; }
        if (requestEtoll === 'Ya' && !saldoEtollAwal) { alert('Silakan isi Saldo E-Toll Awal!'); return; }

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
                        driver_nama: driverNama,
                        penumpang: penumpang,
                        km_awal: kmAwal,
                        bensin_awal: bensinAwal,
                        request_etoll: requestEtoll,
                        saldo_etoll_awal: saldoEtollAwal,
                        status: 'menunggu_leader'
                    }
                ]);

            if (error) throw error;

            document.getElementById('modalCarName').textContent = selectedCar.name;
            document.getElementById('modalLeader').textContent = leaderName;
            
            successModal.classList.add('active');
            
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
        
        if (currentUserSession) {
            let fullName = currentUserSession.user.user_metadata?.full_name || currentUserSession.user.email;
            supabase.from('profiles').select('full_name').eq('id', currentUserSession.user.id).single().then(({data}) => {
                if (data && data.full_name) {
                    namaPeminjamInput.value = data.full_name;
                }
            });
            namaPeminjamInput.value = fullName;
        }

        selectCar(null);
    });

    closeErrorBtn.addEventListener('click', () => {
        errorModal.classList.remove('active');
    });

    // Feedback Form Logic (Laporan Pengembalian)
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackForm = document.getElementById('feedbackForm');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

    window.openFeedbackModal = function(bookingId) {
        document.getElementById('feedbackBookingId').value = bookingId;
        feedbackModal.classList.add('active');
    };

    if (closeFeedbackBtn) {
        closeFeedbackBtn.addEventListener('click', () => {
            feedbackModal.classList.remove('active');
            feedbackForm.reset();
        });
    }

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const bookingId = document.getElementById('feedbackBookingId').value;
            const kmAkhir = document.getElementById('kmAkhir').value;
            const bensinAkhir = document.getElementById('bensinAkhir').value;
            const saldoEtollAkhir = document.getElementById('saldoEtollAkhir').value;
            const catatanAbnormaliti = document.getElementById('catatanAbnormaliti').value;

            submitFeedbackBtn.disabled = true;
            submitFeedbackBtn.innerHTML = 'Mengirim... <i class="bx bx-loader-alt bx-spin"></i>';

            try {
                const { error } = await supabase
                    .from('peminjaman_mobil')
                    .update({ 
                        km_akhir: kmAkhir,
                        bensin_akhir: bensinAkhir,
                        sisa_bensin: bensinAkhir,
                        saldo_etoll_akhir: saldoEtollAkhir,
                        sisa_etol: saldoEtollAkhir,
                        catatan_abnormaliti: catatanAbnormaliti,
                        kondisi_mobil: catatanAbnormaliti,
                        status: 'selesai'
                    })
                    .eq('id', bookingId);

                if (error) throw error;
                
                alert('Berhasil! Mobil telah dikembalikan dan laporan disimpan.');
                
                feedbackModal.classList.remove('active');
                feedbackForm.reset();
                
                if (currentUserSession) {
                    await fetchAndRenderUserHistory(currentUserSession.user.id);
                }
            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('Gagal mengirim laporan. Silakan coba lagi.');
            } finally {
                submitFeedbackBtn.disabled = false;
                submitFeedbackBtn.innerHTML = 'Kirim Laporan';
            }
        });
    }

    // Official Form Replica Modal Logic
    const officialFormModal = document.getElementById('officialFormModal');
    const closeOfficialFormBtn = document.getElementById('closeOfficialFormBtn');
    if (closeOfficialFormBtn) {
        closeOfficialFormBtn.addEventListener('click', () => {
            officialFormModal.classList.remove('active');
        });
    }

    window.openOfficialFormModal = async function(bookingOrId) {
        let booking = bookingOrId;
        if (typeof bookingOrId === 'string') {
            const { data } = await supabase.from('peminjaman_mobil').select('*').eq('id', bookingOrId).single();
            booking = data;
        }
        if (!booking) {
            alert('Data pengajuan tidak ditemukan.');
            return;
        }

        renderOfficialPaperForm(booking);
        officialFormModal.classList.add('active');
    };

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

// Render SVG Fuel Gauge Mini Dial for Paper Form
function generateMiniFuelGaugeSVG(level) {
    const fuelAngles = { 'E': -90, '1/4': -45, '1/2': 0, '3/4': 45, 'F': 90 };
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

// Render Paper Form Replica HTML inside Modal
function renderOfficialPaperForm(booking) {
    const container = document.getElementById('officialFormContent');
    if (!container) return;

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

    // Status per approver untuk form resmi
    const statusApprovedFinal = booking.status === 'disetujui' || booking.status === 'selesai';
    const statusDitolak = booking.status === 'ditolak';
    
    // PIC Peminjaman (Enggar Fata): hanya mengetahui — tidak approve
    const picText = '✉ Mengetahui';
    const picColor = '#64748b';

    // Checker (Hanif): hanya mengetahui — tidak approve
    const checkerText = '✉ Mengetahui';
    const checkerColor = '#64748b';

    // Direct Leader (Aprilia): approve pertama
    let statusLeaderText = 'Pending';
    let statusLeaderColor = '#64748b';
    const leaderDone = ['menunggu_koordinator','menunggu_admin','disetujui','selesai'].includes(booking.status);
    if (leaderDone) { statusLeaderText = '✓ Disetujui'; statusLeaderColor = '#16a34a'; }
    else if (statusDitolak) { statusLeaderText = '✗ Ditolak'; statusLeaderColor = '#ea580c'; }
    else if (booking.status === 'menunggu_leader') { statusLeaderText = 'Menunggu'; statusLeaderColor = '#f97316'; }

    // Koordinator TEFA: approve final
    const koordinatorText = statusApprovedFinal ? '✓ Disetujui' : (statusDitolak ? '✗ Ditolak' : 'Pending');
    const koordinatorColor = statusApprovedFinal ? '#16a34a' : (statusDitolak ? '#ea580c' : '#64748b');

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

        <!-- Row 1 Table -->
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

        <!-- Row 2 Table -->
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
                            ${generateMiniFuelGaugeSVG(bensinAwal)}
                            <span style="font-size:0.72rem; font-weight:700;">Level: ${bensinAwal}</span>
                        </div>
                    </td>
                    <td>
                        <div class="of-fuel-dial-wrapper">
                            ${bensinAkhir !== '-' ? generateMiniFuelGaugeSVG(bensinAkhir) : '<span style="color:#94a3b8;">-</span>'}
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

        <!-- Catatan Abnormaliti -->
        <div class="of-abnormality-box">
            <div class="of-abnormality-title"><i class='bx bx-error-circle'></i> CATATAN ABNORMALITI:</div>
            <div class="of-abnormality-content">
                ${abnormaliti}
            </div>
        </div>

        <!-- Signatures Table (5 Columns) -->
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
                        <div style="font-size:0.7rem; color:#64748b;">${statusApprovedFinal ? 'tgl ' + formatDate(booking.koordinator_approved_at || booking.tanggal) : 'tgl .../.../20...'}</div>
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
            const tglDinas = formatDate(booking.tanggal);

            let badgeClass = 'badge-menunggu';
            let statusIcon = 'bx-time-five';
            let statusText = booking.status;
            
            if (booking.status === 'menunggu_leader') {
                badgeClass = 'badge-menunggu';
                statusIcon = 'bx-time-five';
                statusText = 'Menunggu Leader';
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
            } else if (booking.status === 'selesai') {
                badgeClass = 'badge-disetujui';
                statusIcon = 'bx-check-double';
                statusText = 'Selesai';
            }

            let catatanHtml = '';
            if (booking.catatan_leader) {
                catatanHtml = `<div class="catatan-leader-box" title="Catatan Leader"><strong>Catatan:</strong> ${booking.catatan_leader}</div>`;
            }

            const bensinAwalStr = booking.bensin_awal || 'F';
            const bensinAkhirStr = booking.bensin_akhir || booking.sisa_bensin;

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
                        <div style="font-size:0.75rem; color:#64748b; margin-top:3px;">
                            <i class='bx bx-tachometer'></i> KM Awal: ${booking.km_awal || '-'}
                        </div>
                    </div>
                </td>
                <td data-label="Tujuan">
                    <div class="tujuan-cell">
                        <div class="lokasi">${booking.tujuan}</div>
                        <div class="keperluan">${booking.keperluan}</div>
                        <div style="font-size:0.75rem; color:#64748b; margin-top:3px;">
                            <i class='bx bx-id-card'></i> Driver: ${booking.driver_nama || booking.peminjam_nama}
                        </div>
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
                    
                    <div style="display:flex; flex-direction:column; gap:6px; margin-top: 10px;">
                        ${(booking.status === 'selesai' || booking.status === 'disetujui') && !bensinAkhirStr ? `
                            <button onclick="openFeedbackModal('${booking.id}')" class="btn-primary-solid" style="padding: 6px 12px; font-size: 0.8rem; width: 100%; border-radius: 6px; background: #16a34a;">
                                <i class='bx bx-log-in-circle'></i> Kembalikan Mobil
                            </button>
                        ` : ''}

                        <button onclick="openOfficialFormModal('${booking.id}')" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 6px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; cursor:pointer; font-weight:600; display:flex; align-items:center; justify-content:center; gap:4px;">
                            <i class='bx bx-file'></i> Form Official Cetak
                        </button>
                    </div>
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
