# 🏛️ Sutera Minang — Haute Gastronomy Ordering App
> **Haute Gastronomy • Cita Rasa Pusaka & Tradisi Luhur Nusantara**

Aplikasi pemesanan makanan dan minuman untuk restoran **Sutera Minang**, dirancang dengan estetika mewah (*Dark Obsidian & Royal Heritage Gold*), arsitektur real-time dengan Supabase, serta mendukung alur kerja Pembeli (*Customer*) dan Pengelola (*Admin Dapur & Kasir*).

---

## ✨ Fitur Utama

### 1. 🍽️ Mode Pembeli (*Customer*)
- **Pilihan Layanan**:
  - *Makan di Tempat (Dine-In)*: Lengkap dengan pilihan nomor meja.
  - *Bawa Pulang (Takeaway / Bungkus)*: Lengkap dengan kontak pemesan.
- **20 Hidangan Otentik Sesuai Buku Menu**:
  - **12 Makanan Utama**: Rendang Daging, Dendeng Balado, Ayam Pop, Ayam Gulai, Gulai Tunjang, Gulai Kepala Ikan, Ikan Asam Padeh, Telur Balado, Gulai Cincang, Sate Padang, Perkedel Kentang, Sambal Ijo.
  - **8 Minuman Tradisional**: Teh Talua (Signature 5 Lapis), Kopi Talua, Es Teh Manis, Es Jeruk, Jeruk Nipis Hangat, Kopi Hitam, Teh Manis Hangat, Es Cincau.
- **Kustomisasi Hidangan**: Modal detail untuk menambahkan catatan khusus (misal: "kuah dipisah", "pedas sedang", "es sedikit").
- **Keranjang & Checkout**: Kalkulasi harga otomatis, perincian pesanan, dan tombol kirim pesanan dengan animasi selebrasi & suara lonceng kuningan khas Minang.
- **Live Order Tracker**: Pelacakan status pesanan secara langsung tanpa reload (*Menunggu Konfirmasi* ➔ *Sedang Dimasak* ➔ *Siap Disajikan* ➔ *Selesai*).

### 2. 👨‍🍳 Mode Admin (*Dapur & Kasir Rumah Makan*)
- **Live Kitchen Kanban Board**:
  - Pesanan baru masuk secara real-time via **Supabase Realtime (Websocket)** / Multi-tab BroadcastChannel.
  - Notifikasi suara otomatis saat ada pesanan baru (*Web Audio API Gentle Brass Chime*).
  - Aksi 1-klik perubahan status (*Mulai Masak*, *Siap Disajikan*, *Selesaikan Pesanan*).
- **Cetak Struk Pesanan (*Thermal Receipt Print*)**:
  - Tampilan struk kasir & dapur siap cetak dengan format thermal printer 80mm/58mm.
- **Kelola Menu & Ketersediaan Stok**:
  - Saklar ketersediaan hidangan (*Tersedia* / *Stok Habis*).
  - Fitur ubah harga hidangan secara langsung.
- **Ringkasan Penjualan**:
  - Pemantauan total omset hari ini, pesanan aktif, dan jumlah porsi terlayani.

---

## 🎨 Palet Warna Haute Gastronomy

| Hex Code | Nama Warna | Fungsi |
| :--- | :--- | :--- |
| `#12100E` | Obsidian Midnight | Latar belakang utama |
| `#1A1614` | Deep Espresso | Latar kartu menu & drawer |
| `#D4AF37` | Royal Minang Gold | Tombol utama, aksen ornamen, logo ring |
| `#E5C378` | Champagne Cream Gold | Judul nama hidangan & harga 18K |
| `#DDD2C4` | Warm Parchment | Teks deskripsi rempah |

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Menjalankan di Mode Development
```bash
npm install
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173`.

### 2. Menghubungkan Backend Supabase (Opsional & Sangat Mudah)
Aplikasi ini sudah dilengkapi **Dual Mode**:
- **Offline / Mock Mode**: Berfungsi 100% langsung tanpa setup apa pun menggunakan penyimpanan lokal & sinkronisasi multi-tab.
- **Supabase Realtime Mode**:
  1. Buat project baru di [supabase.com](https://supabase.com).
  2. Buka menu **SQL Editor**, buka file `supabase_schema.sql` di repository ini, lalu jalankan (*Run*) skrip tersebut.
  3. Buka menu **Project Settings → API**, salin *Project URL* dan *anon public key*.
  4. Klik tombol **Database / Supabase** di navbar aplikasi, tempelkan URL & Anon Key, lalu simpan. Aplikasi langsung terhubung ke cloud database secara real-time!

---

## 🗂️ Struktur File
```
Padang/
├── public/
│   ├── assets/
│   │   ├── logo_raw.png        # Logo siluet Rumah Gadang & riak danau
│   │   └── menu_reference.jpg  # Arsip foto buku menu asli
│   └── supabase_schema.sql     # Skrip skema database & seed data
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx   # Panel dapur, kasir & kanban board
│   │   ├── CartDrawer.tsx       # Drawer keranjang & checkout
│   │   ├── CustomerView.tsx     # Katalog menu pembeli
│   │   ├── ItemDetailModal.tsx  # Modal detail catatan khusus (Modern Dialog)
│   │   ├── Logo.tsx             # Komponen logo Rumah Gadang berornamen emas
│   │   ├── MenuCard.tsx         # Kartu hidangan Haute Gastronomy
│   │   ├── Navbar.tsx           # Navigasi atas & pengalih mode
│   │   ├── OrderTrackerModal.tsx# Pelacak status pesanan live
│   │   └── SupabaseModal.tsx    # Modal konfigurasi & integrasi Supabase
│   ├── data/
│   │   └── initialMenu.ts       # 20 data menu asli dari foto
│   ├── lib/
│   │   └── supabase.ts          # Layanan Supabase client & sync realtime
│   ├── types/
│   │   └── index.ts             # Interface TypeScript
│   ├── utils/
│   │   └── audio.ts             # Sintesis suara lonceng dapur Minang
│   ├── App.tsx                  # Controller utama aplikasi
│   ├── index.css                # Konfigurasi Tailwind CSS v4 & tema warna
│   └── main.tsx                 # Entrypoint React 19
├── supabase_schema.sql          # SQL Schema & Seed DDL
└── vite.config.ts               # Konfigurasi Vite & Tailwind v4
```
# sutera-minang
