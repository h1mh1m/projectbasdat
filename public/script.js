const BASE_URL = "http://localhost:3000";
let isLoginMode = true;
let currentRedeemRewardId = null;

// --- UTILITIES ---
const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
};
const isLoggedIn = () => !!localStorage.getItem("token");
const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

// --- NAVIGATION & URL ROUTING (TANPA HASH #) ---
function navigate(viewId, param = null) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    const loggedIn = isLoggedIn();
    document.getElementById('nav-dashboard').style.display = loggedIn ? 'block' : 'none';
    document.getElementById('nav-cart').style.display = loggedIn ? 'flex' : 'none';
    document.getElementById('btn-login-logout').innerText = loggedIn ? 'Logout' : 'Login';

    // Set URL Bersih
    let url = '/';
    if (viewId === 'restoran') url = '/restaurant';
    else if (viewId === 'cart') url = '/cart';
    else if (viewId === 'dashboard') url = '/dashboard';
    else if (viewId === 'auth') url = '/login';
    else if (viewId === 'detail') url = `/restaurant/${param}`;

    // Mengubah URL tanpa merefresh halaman
    if (window.location.pathname !== url) {
        window.history.pushState({ viewId, param }, '', url);
    }

    if(viewId === 'beranda') loadBeranda();
    if(viewId === 'restoran') loadRestoran();
    if(viewId === 'cart') loadCart();
    if(viewId === 'dashboard') loadDashboard();
    
    window.scrollTo(0,0);
}

// Menangani tombol Back/Forward di Browser
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.viewId) {
        navigate(event.state.viewId, event.state.param);
    } else {
        initialRoute();
    }
});

// Fungsi untuk membaca URL saat pertama kali web dibuka
function initialRoute() {
    const path = window.location.pathname;
    if (path === '/restaurant') navigate('restoran');
    else if (path === '/cart') navigate('cart');
    else if (path === '/dashboard') navigate('dashboard');
    else if (path === '/login') navigate('auth');
    else if (path.startsWith('/restaurant/')) {
        const id = path.split('/')[2];
        if (id) viewRestoDetail(id);
        else navigate('restoran');
    }
    else navigate('beranda');
}

// --- AUTHENTICATION ---
function toggleAuth() {
    if (isLoggedIn()) {
        localStorage.removeItem("token");
        alert("Berhasil Logout!");
        navigate('beranda');
    } else {
        navigate('auth');
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Login ke MakanKuy" : "Daftar MakanKuy";
    document.getElementById('btn-submit-auth').innerText = isLoginMode ? "Login" : "Daftar Sekarang";
    document.getElementById('link-auth-mode').innerText = isLoginMode ? "Belum punya akun? Daftar" : "Sudah punya akun? Login";
    document.getElementById('group-nama').style.display = isLoginMode ? "none" : "block";
    document.getElementById('group-nomor').style.display = isLoginMode ? "none" : "block";
}

async function submitAuth() {
    const email = document.getElementById('input-email').value;
    const password = document.getElementById('input-password').value;

    try {
        if (isLoginMode) {
            // CATATAN: Di backend kamu, login menggunakan GET. 
            // Browser Fetch API akan menolak jika method GET memiliki body.
            // PASTIKAN kamu mengubah web.get('/login') menjadi web.post('/login') di backend.
            const res = await fetch(`${BASE_URL}/login`, {
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("token", data.token);
                navigate('dashboard');
            } else alert(data.error || "Login gagal");
        } else {
            const nama = document.getElementById('input-nama').value;
            const nomor = document.getElementById('input-nomor').value;
            const res = await fetch(`${BASE_URL}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nama, email, password, nomor })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Daftar berhasil! Silakan login.");
                toggleAuthMode();
            } else alert(data.error);
        }
    } catch (err) { console.error(err); }
}

// --- FETCH DATA ---

async function loadBeranda() {
    try {
        const res = await fetch(`${BASE_URL}/`);
        const data = await res.json();
        const container = document.getElementById('beranda-resto-list');
        container.innerHTML = '';
        
        // Di backendmu tertulis const {restoranResult} = await db.query...
        // Jika data.restoran undefined, ini yang jadi penyebabnya.
        if(data.restoran) {
            data.restoran.slice(0, 4).forEach((r, i) => {
                container.innerHTML += `
                    <div class="resto-card" onclick="viewRestoDetail(${r.restaurant_id})">
                        <img src="https://picsum.photos/400/300?food=${i}" alt="${r.nama_restaurant}">
                        <div class="resto-card-body">
                            <span class="badge">${r.kategori}</span>
                            <h3 class="resto-card-title">${r.nama_restaurant}</h3>
                        </div>
                    </div>
                `;
            });
        }
    } catch (e) { console.log(e); }
}

async function loadRestoran() {
    if(!isLoggedIn()) return navigate('auth');
    try {
        const res = await fetch(`${BASE_URL}/restaurant`, { headers: getHeaders() });
        const data = await res.json();
        renderRestoList(data);
    } catch (e) { console.log(e); }
}

async function searchRestoran() {
    const q = document.getElementById('searchInput').value;
    try {
        const res = await fetch(`${BASE_URL}/restaurant`, {
            method: "POST", headers: getHeaders(), body: JSON.stringify({ pencarian: q })
        });
        const data = await res.json();
        renderRestoList(data);
    } catch (e) { console.log(e); }
}

function renderRestoList(data) {
    const container = document.getElementById('restoran-list');
    if(!data || data.length === 0) {
        container.innerHTML = "<p>Tidak ditemukan.</p>";
        return;
    }
    container.innerHTML = "";
    data.forEach((r, i) => {
        container.innerHTML += `
            <div class="resto-card" onclick="viewRestoDetail(${r.restaurant_id})">
                <img src="https://picsum.photos/400/300?resto=${i}" alt="${r.nama_restaurant}">
                <div class="resto-card-body">
                    <span class="badge">${r.kategori}</span>
                    <h3 class="resto-card-title">${r.nama_restaurant}</h3>
                </div>
            </div>
        `;
    });
}

async function viewRestoDetail(id) {
    if(!isLoggedIn()) return navigate('auth');
    try {
        const res = await fetch(`${BASE_URL}/restaurant/${id}`, { headers: getHeaders() });
        const data = await res.json();
        
        document.getElementById('detail-kategori').innerText = data.restaurant.kategori;
        document.getElementById('detail-nama').innerText = data.restaurant.nama_restaurant;
        
        const menuContainer = document.getElementById('menu-list');
        menuContainer.innerHTML = '';
        data.menu.forEach((m, i) => {
            menuContainer.innerHTML += `
                <div class="menu-card">
                    <div class="menu-info">
                        <h4>${m.nama_menu || 'Menu Spesial'}</h4>
                        <p class="menu-price">${formatRp(m.harga)}</p>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="addToCart(${id}, ${m.menu_id}, ${m.harga})">+ Tambah</button>
                </div>
            `;
        });
        navigate('detail', id);
    } catch (e) { console.log(e); }
}

async function addToCart(restoId, menuId, harga) {
    try {
        const res = await fetch(`${BASE_URL}/restaurant/${restoId}`, {
            method: "POST", headers: getHeaders(),
            body: JSON.stringify({ menu: menuId, jumlah: 1, harga: harga })
        });
        if(res.ok) alert("Menu ditambahkan ke keranjang!");
    } catch (e) { console.log(e); }
}

async function loadCart() {
    try {
        const res = await fetch(`${BASE_URL}/cart`, { headers: getHeaders() });
        const data = await res.json();
        const container = document.getElementById('cart-items-container');
        let total = 0;
        
        container.innerHTML = data.length === 0 ? "<p>Keranjang kosong.</p>" : "";
        data.forEach(item => {
            total += parseInt(item.total_bayar);
            container.innerHTML += `
                <div class="menu-card">
                    <div class="menu-info">
                        <h4>Order ID: #ORD-${item.order_id}</h4>
                        <p class="menu-price">${formatRp(item.total_bayar)}</p>
                    </div>
                </div>
            `;
        });
        document.getElementById('cart-total').innerText = formatRp(total);
    } catch (e) { console.log(e); }
}

async function checkoutCart() {
    try {
        const resGet = await fetch(`${BASE_URL}/cart`, { headers: getHeaders() });
        const data = await resGet.json();
        if(data.length === 0) return alert("Keranjang kosong!");
        
        const resPost = await fetch(`${BASE_URL}/cart`, {
            method: "POST", headers: getHeaders(),
            body: JSON.stringify({ order_id: data[0].order_id })
        });
        if(resPost.ok) {
            alert("Pesanan berhasil dibuat!");
            navigate('dashboard');
        }
    } catch (e) { console.log(e); }
}

async function loadDashboard() {
    try {
        const res = await fetch(`${BASE_URL}/dashboard`, { headers: getHeaders() });
        const data = await res.json();
        
        document.getElementById('profile-info').innerHTML = `
            <div>
                <h3>${data.profile.nama}</h3>
                <p>${data.profile.email}</p>
                <p>${data.profile.nomor_telepon}</p>
            </div>
        `;

        const rewardContainer = document.getElementById('reward-list');
        rewardContainer.innerHTML = '';
        data.rewards.forEach(rew => {
            rewardContainer.innerHTML += `
                <div class="reward-card">
                    <div>
                        <h4>Reward #${rew.reward_id}</h4>
                        <span class="badge">Stok: ${rew.stok}</span>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="openRewardModal(${rew.reward_id})">Tukar</button>
                </div>
            `;
        });

        const historyContainer = document.getElementById('history-list');
        historyContainer.innerHTML = data.history.length === 0 ? "<p>Belum ada history.</p>" : "";
        data.history.forEach(h => {
            historyContainer.innerHTML += `
                <div class="history-item">
                    <div>
                        <h4>Order #ORD-${h.order_id}</h4>
                        <p>${formatRp(h.total_bayar)}</p>
                    </div>
                    <span>${h.status}</span>
                </div>
            `;
        });
    } catch (e) { console.log(e); }
}

function openRewardModal(rewardId) {
    currentRedeemRewardId = rewardId;
    document.getElementById('reward-modal').style.display = 'flex';
}

function closeRewardModal() {
    document.getElementById('reward-modal').style.display = 'none';
    currentRedeemRewardId = null;
}

document.getElementById('btn-confirm-redeem').addEventListener('click', async () => {
    if(!currentRedeemRewardId) return;
    try {
        const res = await fetch(`${BASE_URL}/dashboard`, {
            method: "POST", headers: getHeaders(),
            body: JSON.stringify({ reward_id: currentRedeemRewardId })
        });
        if(res.ok) {
            alert("Reward berhasil ditukar!");
            closeRewardModal();
            loadDashboard();
        } 
    } catch (e) { console.log(e); }
});

// Jalankan ketika file diload
initialRoute();