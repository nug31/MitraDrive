# Buku Panduan Penggunaan Aplikasi MitraDrive

## 1. Pendahuluan
Aplikasi MitraDrive adalah sistem informasi berbasis web yang digunakan untuk mengelola peminjaman kendaraan operasional secara digital. Sistem ini dilengkapi dengan alur persetujuan (approval) berjenjang yang transparan dan tertib administrasi.

## 2. Alur Persetujuan Peminjaman (Approval Flow)
Setiap pengajuan peminjaman kendaraan akan melalui 4 tahap verifikasi wajib:
1. **PIC Peminjaman (Enggar Fata)**: Memverifikasi kelengkapan administrasi data awal peminjam (Driver, Penumpang, KM, Bensin, E-Toll).
2. **Checker (Hanif / Umar)**: Melakukan pengecekan kondisi kesiapan fisik/teknis kendaraan sebelum digunakan.
3. **Direct Leader (Wakasek / HOD)**: Menyetujui atau menolak penggunaan kendaraan berdasarkan urgensi dinas anggota timnya.
4. **Koordinator TEFA (Aprilia Rahayu)**: Memberikan persetujuan akhir (Final Approval).

## 3. Panduan Untuk Peminjam
1. Buka halaman utama web MitraDrive.
2. Jika belum memiliki akun, klik **Login** lalu pilih menu **Daftar Akun** dan buat akun menggunakan Email.
3. Setelah Login, pada halaman utama Anda akan melihat daftar kendaraan. Kendaraan yang bisa dipinjam ditandai dengan label **Tersedia**.
4. Klik tombol **Pinjam** pada kendaraan pilihan Anda.
5. Isi **Formulir Peminjaman** dengan lengkap (Rencana Perjalanan, Tujuan, Keperluan, Nama Driver, Penumpang, Odometer, Indikator Bensin, Request E-Toll, dan pilih **Nama Leader** Anda).
6. Klik **Ajukan Peminjaman**.
7. Status pengajuan Anda dapat dipantau langsung di bagian bawah halaman utama pada tabel **Histori Peminjaman Saya**.
8. **PENTING:** Setelah selesai menggunakan mobil, Anda wajib login kembali, cari permohonan Anda di histori, lalu tekan tombol **Kembalikan Mobil** untuk mengisi form pengembalian (KM Akhir, Bensin Akhir, dan Kondisi Mobil).

## 4. Panduan Untuk Approver (PIC, Checker, Leader, Koordinator)
1. Buka aplikasi web dan klik **Login**.
2. Masukkan Email dan Password khusus Anda. Sistem akan otomatis mendeteksi Role Anda dan mengarahkan Anda ke **Dashboard Khusus** (Panel PIC, Panel Checker, Panel Leader, atau Panel Koordinator).
3. Di Dashboard, Anda akan melihat tabel berisi daftar permohonan yang **Menunggu Persetujuan Anda**.
4. Detail lengkap operasional (Nama Driver, Penumpang, KM, Bensin, E-Toll) dapat dilihat langsung pada kolom *Tujuan & Keperluan*.
5. **Setujui:** Klik tombol dengan ikon **Centang Hijau** (Setujui) untuk meloloskan pengajuan ke tahap berikutnya.
6. **Tolak:** Klik tombol dengan ikon **Silang Merah** (Tolak) jika pengajuan ditolak. Pengajuan yang ditolak akan langsung berhenti prosesnya.

## 5. Panduan Untuk Administrator (Admin GA)
1. Login menggunakan akun khusus Admin.
2. Anda akan diarahkan ke **Panel Admin** yang memiliki hak istimewa untuk memonitor seluruh pergerakan status.
3. Fitur Utama Admin:
   - **Tandai Selesai**: Mengubah status peminjaman menjadi selesai jika peminjam lupa menekan tombol kembalikan mobil.
   - **Reset Status**: Mengembalikan status persetujuan ke tahap sebelumnya jika terjadi kesalahan sistem atau kesalahan approve.
   - **Cetak Form Resmi**: Mencetak Surat Jalan / Bukti Peminjaman fisik yang mencakup riwayat tanda tangan digital seluruh Approver.
   - **Export Excel**: Mengunduh seluruh rekap data peminjaman kendaraan ke dalam format Excel (.xlsx) untuk kebutuhan pelaporan.
