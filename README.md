# Screener Backend

Screener adalah backend system untuk melakukan evaluasi kandidat secara otomatis berdasarkan **CV** dan **Project Report**, menggunakan model **Gemini API** dan **ChromaDB** untuk analisis semantik.

## Fitur Utama

- Upload dan menyimpan CV & laporan proyek
- Evaluasi otomatis menggunakan **Gemini AI**
- Penyimpanan hasil embedding di **ChromaDB**
- Penyimpanan hasil evaluasi di **PostgreSQL**
- Sistem job queue untuk memproses tugas evaluasi otomatis

---

## Arsitektur

```
User → Express API → Job Queue → Gemini Evaluation → PostgreSQL + ChromaDB
```

---

## Struktur Folder

```
src/
├── app.js                # Entry point utama
├── routes/               # Endpoint API (upload, evaluate, result)
├── jobs/queue.js         # Sistem antrian evaluasi
├── services/chroma.js    # Integrasi ChromaDB & Embeddings
├── utils/pdf.js          # Pembacaan file PDF menggunakan pdfjs-dist
└── db.js                 # Koneksi PostgreSQL
```

---

## Instalasi Manual (Tanpa Docker)

### 1️⃣ Clone Repository
```bash
git clone https://github.com/username/screener.git
cd screener
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Buat file `.env`
```bash
GEMINI_API_KEY=your_google_api_key
DATABASE_URL=postgresql://screener:screener123@localhost:5432/screenerdb
CHROMA_URL=http://localhost:8000
PORT=3000
```

### 4️⃣ Jalankan Server
```bash
npm run dev
```

Server berjalan di `http://localhost:3000`

---

## Jalankan Menggunakan Docker Compose

### 1️⃣ Pastikan Docker dan Docker Compose sudah terinstal

### 2️⃣ Jalankan semua service
```bash
docker compose up -d
```

### 3️⃣ Akses:
- **API Backend:** http://localhost:3000  
- **ChromaDB:** http://localhost:8000  
- **PostgreSQL:** http://localhost:5432

---

##  Endpoint Utama

### Upload File
```
POST /upload
Form Data:
  - file: <PDF File>
  - type: cv | report
```

### Evaluasi Kandidat
```
POST /evaluate
Body (JSON):
{
  "job_title": "Backend Engineer",
  "cv_id": 1,
  "report_id": 2
}
```

### Lihat Hasil Evaluasi
```
GET /result/:job_id
```

---

## Teknologi yang Digunakan

- **Node.js + Express**
- **PostgreSQL**
- **ChromaDB**
- **Gemini API (Google Generative AI)**
- **pdfjs-dist** untuk parsing PDF
- **Docker & Docker Compose**

---

