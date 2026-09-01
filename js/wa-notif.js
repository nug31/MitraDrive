// ============================================================
// wa-notif.js — Modul Notifikasi WhatsApp via Fonnte API
// MitraDrive | Kirim notif otomatis ke Leader & Koordinator TEFA
// ============================================================

// ⚠️ Ganti dengan Token Fonnte Anda dari https://md.fonnte.com
const FONNTE_TOKEN = 'ixzLpZvyisH4fQga1bJq';

const DASHBOARD_BASE_URL = 'https://mitradrive.netlify.app';

/**
 * Kirim pesan WhatsApp ke satu nomor via Fonnte API
 * @param {string} phone - Nomor tujuan format internasional tanpa + (mis: 6281234567890)
 * @param {string} message - Teks pesan yang akan dikirim
 * @returns {Promise<object>} Response dari Fonnte API
 */
export async function sendWhatsAppNotif(phone, message) {
    if (!phone || !message) return null;

    // Bersihkan nomor: hapus +, spasi, strip
    const cleanPhone = phone.replace(/[\s+\-]/g, '');

    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': FONNTE_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: cleanPhone,
                message: message,
                countryCode: '62'
            })
        });
        const result = await response.json();
        console.log(`[WA Notif] Sent to ${cleanPhone}:`, result);
        return result;
    } catch (err) {
        // Notif WA gagal tidak boleh menghalangi proses utama
        console.warn('[WA Notif] Gagal kirim notif:', err);
        return null;
    }
}

/**
 * Kirim notifikasi pengajuan baru ke Leader dan Koordinator TEFA
 * @param {object} params - Data pengajuan
 * @param {string} params.leaderPhone - Nomor WA Direct Leader
 * @param {string} params.leaderNama - Nama Direct Leader
 * @param {string} params.koordinatorPhone - Nomor WA Koordinator TEFA
 * @param {string} params.peminjamNama - Nama peminjam
 * @param {string} params.kendaraanNama - Nama kendaraan
 * @param {string} params.kendaraanPlat - Plat nomor kendaraan
 * @param {string} params.tanggal - Tanggal peminjaman (YYYY-MM-DD)
 * @param {string} params.jamMulai - Jam mulai
 * @param {string} params.jamSelesai - Jam selesai
 * @param {string} params.tujuan - Tujuan perjalanan
 * @param {string} params.keperluan - Keperluan
 * @param {string} params.driverNama - Nama driver
 */
export async function notifPengajuanBaru({
    leaderPhone,
    leaderNama,
    koordinatorPhone,
    peminjamNama,
    kendaraanNama,
    kendaraanPlat,
    tanggal,
    jamMulai,
    jamSelesai,
    tujuan,
    keperluan,
    driverNama
}) {
    // Format tanggal menjadi human-readable
    let tanggalFormatted = tanggal;
    try {
        tanggalFormatted = new Date(tanggal).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    } catch (_) { }

    // ── Pesan untuk Direct Leader ──────────────────────────────
    const pesanLeader =
        `🚗 *Pengajuan Peminjaman Kendaraan*
📋 Perlu persetujuan Anda

Peminjam   : *${peminjamNama}*
Driver     : *${driverNama}*
Kendaraan  : *${kendaraanNama}* (${kendaraanPlat})
Tanggal    : *${tanggalFormatted}*
Jam        : ${jamMulai} – ${jamSelesai}
Tujuan     : ${tujuan}
Keperluan  : ${keperluan}

Silakan buka dashboard untuk menyetujui atau menolak:
🔗 ${DASHBOARD_BASE_URL}/leader-dashboard.html`;

    // (Hanya kirim ke Leader terlebih dahulu)
    const results = await Promise.allSettled([
        leaderPhone ? sendWhatsAppNotif(leaderPhone, pesanLeader) : Promise.resolve(null)
    ]);

    return results;
}

/**
 * Kirim notifikasi ke Koordinator TEFA setelah Leader setuju
 */
export async function notifKoordinatorApprove({
    koordinatorPhone,
    peminjamNama,
    kendaraanNama,
    kendaraanPlat,
    tanggal,
    jamMulai,
    jamSelesai,
    tujuan,
    keperluan,
    leaderNama,
    driverNama
}) {
    let tanggalFormatted = tanggal;
    try {
        tanggalFormatted = new Date(tanggal).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    } catch (_) { }

    const pesanKoordinator =
        `📢 *Info Pengajuan Peminjaman Baru*
✅ (Telah disetujui oleh Direct Leader: ${leaderNama})

Peminjam   : *${peminjamNama}*
Driver     : *${driverNama}*
Kendaraan  : *${kendaraanNama}* (${kendaraanPlat})
Tanggal    : *${tanggalFormatted}*
Jam        : ${jamMulai} – ${jamSelesai}
Tujuan     : ${tujuan}
Keperluan  : ${keperluan}

Silakan pantau dan setujui di dashboard koordinator:
🔗 ${DASHBOARD_BASE_URL}/koordinator-dashboard.html`;

    const results = await Promise.allSettled([
        koordinatorPhone ? sendWhatsAppNotif(koordinatorPhone, pesanKoordinator) : Promise.resolve(null),
    ]);

    return results;
}
