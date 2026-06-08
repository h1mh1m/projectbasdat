import express from "express";
import web from "./route/customer.js";
import cors from "cors"; // Jangan lupa jalankan: npm install cors

const app = express();

// 1. Konfigurasi dasar (Parser & CORS) ditaruh paling atas
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Taruh static folder SEBELUM route 'web'
// Supaya saat buka localhost:3000, index.html yang diprioritaskan tampil
app.use(express.static('public'));

// 3. Terakhir, baru masukkan route dari backend-mu
app.use(web);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});