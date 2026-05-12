# Plan: Menyajikan Materi PDF di Halaman Learn

## Pendekatan: `react-pdf` (pdf.js)

Render PDF langsung di browser dengan kontrol UI penuh, cocok dengan tema game yang fun.

---

## Step by Step

### Step 1: Install Dependensi

```bash
npm install react-pdf
```

`react-pdf` internally menggunakan `pdfjs-dist`, worker akan di-copy otomatis oleh Next.js.

---

### Step 2: Database & Storage (Supabase)

Materi tidak hardcoded lagi, tapi diambil dari Supabase.

**Tabel `materi`:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | int8 (PK) | ID materi |
| `title` | text | Judul materi |
| `description` | text | Deskripsi singkat |
| `icon` | text | Emoji icon |
| `difficulty` | text | Mudah / Sedang / Sulit |
| `duration` | text | Durasi belajar |
| `total_lessons` | int4 | Total halaman/lesson |
| `pdf_url` | text | URL PDF di Supabase Storage |
| `order` | int4 | Urutan tampil |
| `is_locked` | bool | Status terkunci |
| `created_at` | timestamptz | |

**Supabase Storage:**
- Bucket: `materi`
- Path: `{id}/{filename}.pdf`
- Public atau signed URL (tergantung kebutuhan)

**URL Aman:**
- Gunakan Supabase signed URL (expiry diatur) untuk akses terbatas
- Atau set bucket ke public untuk kemudahan (sesuai kebutuhan)

---

### Step 3: Fetch Materi dari Supabase

Update `src/app/learn/page.tsx`:

- Ganti `materiList` hardcoded dengan fetch dari tabel `materi`
- Query: `select * from materi order by order`
- Loading state sudah ada (spinner)

---

### Step 4: Dynamic Route

Buat file `src/app/learn/[id]/page.tsx`:

- Gunakan `useParams()` untuk ambil `id`
- Fetch materi by id dari Supabase
- Load PDF dari `pdf_url`
- Render komponen PDF Viewer

---

### Step 5: Komponen PDF Viewer Kustom

Buat `src/components/learn/PdfViewer.tsx`

**Props:**
```
pdfUrl: string
title: string
```

**Fitur:**
- **Page navigator**: tombol Prev/Next dengan icon `ChevronLeft` / `ChevronRight` dari lucide-react
- **Indikator halaman**: "Halaman {page} dari {numPages}"
- **Progress bar**: gradient biru (sama style dengan card)
- **Loading state**: spinner biru
- **Error state**: pesan "Gagal muat materi" dengan tombol ulang
- **Zoom kontrol** (opsional): zoom in/out

**Styling:**
- Background putih, rounded-2xl, shadow — konsisten dengan card
- Fredoka font untuk judul
- Warna biru (blue-50, blue-600, dll) sesuai tema
- Animasi transisi antar halaman

---

### Step 6: Update `src/app/learn/page.tsx`

- Ganti data hardcoded dengan fetch dari Supabase
- Tambah `onClick` di button card:

```tsx
onClick={() => router.push(`/learn/${materi.id}`)}
```

---

### Step 7: Layout Halaman Detail

```
+------------------------------------+
| TopBar                             |
| RoomNavigation                     |
+------------------------------------+
| [← Kembali]                        |
| Judul Materi                       |
| Deskripsi                          |
| +--------------------------------+ |
| |                                | |
| |         PDF VIEWER             | |
| |                                | |
| +--------------------------------+ |
| ◀ Halaman 1 dari 10 ▶  [25%]    | |
+------------------------------------+
| NavigationBar                      |
+------------------------------------+
```

- Tombol "Kembali" → `router.back()` atau `router.push('/learn')`
- Judul & deskripsi materi di atas viewer
- PDF Viewer di tengah
- Navigasi halaman di bawah viewer

---

### Step 8: State Management (di halaman detail)

- `materi`: data materi dari Supabase
- `numPages`: total halaman (dari callback `onLoadSuccess` react-pdf)
- `pageNumber`: halaman aktif (di-set via tombol navigasi)
- `isLoading`: loading state untuk auth + fetch data
- `pdfLoading`: loading state untuk PDF
- `error`: error state

---

### Step 9: Struktur File Final

```
src/
├── app/learn/
│   ├── page.tsx               ← fetch dari Supabase + onClick navigasi
│   └── [id]/
│       └── page.tsx           ← fetch materi by id + PDF viewer
├── components/learn/
│   └── PdfViewer.tsx          ← komponen PDF viewer kustom
```

> **Catatan:** PDF tersimpan di Supabase Storage, bukan di `public/`.

---

## Catatan Penting

- **Signed URL vs Public**: Jika materi bersifat privat untuk pengguna terautentikasi, gunakan signed URL (paling aman). Jika publik, set bucket ke public.
- **react-pdf worker**: Pastikan worker pdfjs terkonfigurasi dengan benar untuk Next.js.
- **Loading state**: Tampilkan spinner biru yang konsisten dengan halaman lain.
- **Error handling**: Tampilkan pesan error yang user-friendly dengan opsi reload.
- **Security**: Pastikan hanya user terautentikasi yang bisa mengakses konten (sesuaikan RLS policy di Supabase jika perlu).
