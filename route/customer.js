import express from "express";
import makankuy from "../DB/db.js";
import jwt from "jsonwebtoken";
import cors from "cors";
// letakkan sebelum route:


const web = express.Router()
const db = makankuy.db;
web.use(express.json());
web.use(cors());
web.post("/signup", async (req, res) => {
    try {
        const {nama, email, password,nomor} = req.body
        if(!nama || !email || !password || !nomor){
            return res.status(400).json({ error: "field are required" })
        }
        const [existingUser] = await db.query("SELECT email FROM customer WHERE email = ?", [email])
        if (existingUser.length > 0) {
            return res.status(409).json({ error: "Email already exists" })
        }
        const [result] = await db.query("INSERT INTO customer (nama, email, password, nomor_telepon) VALUES (?, ?, ?, ?)", [nama, email, password, nomor])
        res.json({ message: "Signup successful", customer_id: result.insertId }).status(201)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

web.post("/login",async (req, res) =>{
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" })
        }
        const [user] = await db.query("SELECT * FROM customer WHERE email = ?", [email])
        if (user.length === 0 || user[0].password !== password) {
            return res.status(401).json({ error: "Invalid email or password" })
        }
        const token = jwt.sign({ customer_id: user[0].customer_id }, "secretkey", { expiresIn: "1h" })
        res.json({ message: "Login successful", token }).status(200)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});
function authorizationToken(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ error: "Authorization header missing" })
    }
    const token = authHeader.split(" ")[1]
    jwt.verify(token, "secretkey", (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" })
        }
        req.user = user
        next()
    })
}
web.get("/", async (req, res) => {
    try {
        const [restoranResult] = await db.query("SELECT * FROM restaurant")
        res.json({
            message: "Welcome to the customer dashboard",
            restoran: restoranResult
        }).status(200)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

web.get("/restaurant", authorizationToken, async (req, res)=> {
    try {
        const {categori} = req.query
        let querySql = "SELECT * FROM restaurant"
        let queryParams = []
        if (categori && categori !== 'Semua'){
            querySql += " WHERE kategori = ?"
            queryParams.push(categori)
        } 
        const [restaurants] = await db.query(querySql, queryParams)
        res.json(restaurants)

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});
web.post("/restaurant", authorizationToken, async (req, res) => {
    try {
        const {pencarian} = req.body
        const [result] = await db.query("SELECT * FROM restaurant WHERE nama_restaurant= ? OR kategori = ?", [pencarian, pencarian])
        const [id_res] = await db.query("SELECT restaurant_id FROM restaurant WHERE nama_restaurant= ? OR kategori = ?", [pencarian, pencarian])
        res.json(result).status(200)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});
web.get("/restaurant/:id", authorizationToken, async (req, res) => {
    try {
        const { id } = req.params
        const [result] = await db.query("SELECT * FROM restaurant WHERE restaurant_id = ?", [id])
        const [menu2] = await db.query("SELECT * FROM menus WHERE restaurant_id = ?", [id])
        delete result[0].restaurant_id
        delete result[0].admin_id
        if (result.length === 0) {
            return res.status(404).json({ error: "Restaurant not found" })
        }
        res.json({ restaurant: result[0], menu: menu2 })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

web.post("/restaurant/:id", authorizationToken, async (req, res) => {
  try {
    const { menu, jumlah, harga } = req.body;
    const restaurant_id = req.params.id;
    const customer_id = req.user.customer_id; 

    const total_harga = jumlah * harga;
    const status = "Pending";
    const [orderResult] = await db.query(
      "INSERT INTO orders (customer_id, restaurant_id, total_bayar, status) VALUES (?, ?, ?, ?)",
      [customer_id, restaurant_id, total_harga, status]
    );
    const insertOrderId = orderResult.insertId; 
    await db.query(
      "INSERT INTO order_items (order_id, menu_id, jumlah, subtotal) VALUES (?, ?, ?, ?)",
      [insertOrderId, menu, jumlah, total_harga]
    );

    res.status(200).json({ 
      message: "Item added to cart and order created successfully",
      orderId: insertOrderId 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
web.get("/cart", authorizationToken,async (req, res) => {
    try {
        const idUser = req.user.customer_id;
        const [orderedcart_items] = await db.query("SELECT * FROM orders WHERE customer_id = ? AND status = 'Pending'", [idUser])
        const [itemDetails] = await db.query("SELECT * FROM order_items WHERE order_id IN (?)", [orderedcart_items.map(item => item.order_id)])
        res.json(orderedcart_items)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});
web.post("/cart", authorizationToken, async (req, res) => {
    try {
        const idUser = req.user.customer_id;
        const { order_id } = req.body
        await db.query("UPDATE orders SET status = 'Dalam Proses' WHERE order_id = ? AND customer_id = ?", [order_id, idUser])
        res.json({ message: "Order confirmed successfully" }).status(200)
    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
});
web.get("/dashboard", authorizationToken, async (req, res) => {
    try {
        const idUser = req.user.customer_id;
        const [rewards] = await db.query("SELECT * FROM rewards WHERE stok > 0")
        const [profile] = await db.query("SELECT * FROM customer WHERE customer_id = ?", [idUser])
        const [history] = await db.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY tanggal_pesanan DESC LIMIT 5', [idUser])
        res.json({ profile: profile[0], rewards: rewards, history: history })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});
web.post("/dashboard", authorizationToken, async (req, res) => {
    try {
        const idUser = req.user.customer_id;
        const { reward_id } = req.body
        const [reward] = await db.query("SELECT * FROM rewards WHERE reward_id = ?", [reward_id])
        if (reward.length === 0 || reward[0].stok <= 0) {
            return res.status(404).json({ error: "Reward not found or out of stock" })
        }
        await db.query("INSERT INTO redemptions (customer_id, reward_id) VALUES (?, ?)", [idUser, reward_id])
        await db.query("UPDATE rewards SET stok = stok - 1 WHERE reward_id = ?", [reward_id])
        res.json({ message: "Reward redeemed successfully" }).status(200)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

export default web;