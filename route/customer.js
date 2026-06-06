import express from "express";
import makankuy from "../DB/db.js";
import jwt from "jsonwebtoken";
import { is } from "zod/locales";

const web = express.Router()
const db = makankuy.db;
web.use(express.json());

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
web.get("/signup", async (req, res) => {});
web.get("/login", async (req, res) => {});
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
web.get("/",authorizationToken, async (req, res) => {
    try {
        const {restoranResult} = await db.query("SELECT * FROM restaurant")
        res.json({
            message: "Welcome to the customer dashboard",
            restoran: restoranResult
        }).status(200)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

// web.post("/", async (req, res) => {
//     try {
//         const { restoranId } = req.body
//         const [resultRestoran] = await db.query("SELECT * FROM restaurants WHERE restaurant_id = ?",[restoranId])
//         delete resultRestoran[0].admin_id
//         const [resultMenu] = await db.query("SELECT * FROM menus WHERE nama_restoran= ? OR kategori = ?", [restoranId])
//         resultMenu.forEach(menu=>{
//             delete resultMenu.admin_id
//             delete resultMenu.restaurant_id
//             delete resultMenu.stok
//         })
//         res.json(result).status(200)
//     } catch (error) {
//         res.status(500).json({ error: error.message })
//     }
// });
web.get("/restaurant", authorizationToken, async (req, res)=> {
    try {
        if(isLoggedIn){
        const {categori} = req.query
        let querySql = "SELECT * FROM restaurant"
        let queryParams = []
        if (categori && categori !== 'Semua'){
            querySql += " WHERE kategori = ?"
            queryParams.push(categori)
        } 
        const [restaurants] = await db.query(querySql, queryParams)
        res.json(restaurants)}

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
        res.redirect(`/restaurant/${id_res[0].restaurant_id}`)
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
        const {menu, jumlah, harga} = req.body
        let total_harga = jumlah * harga
        const itemToOrders = 
        {

        }
        res.json({ message: "Item added to cart successfully" }).status(200)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});
web.get("/cart/:idUser", async (req, res) => {
    try {
        const { idUser } = req.params
        const [orderedcart_items] = await db.query("SELECT * FROM orders WHERE customer_id = ? AND status = 'Pending'", [idUser])
        orderedcart_items.forEach(item => {
            delete item.order_id
            delete item.customer_id
            delete item.restaurant_id
            delete item.menu_id
        })
        res.json(orderedcart_items)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});
web.post("/:idUser/cart", async (req, res) => {
    try {
        const { idUser } = req.params
        const { order_id } = req.body
        await db.query("UPDATE orders SET status = 'Dalam Proses' WHERE order_id = ? AND customer_id = ?", [order_id, idUser])
        res.json({ message: "Order confirmed successfully" }).status(200)
    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
});
web.get("/:idUser/dashboard", async (req, res) => {
    try {
        const { idUser } = req.params
        const [rewards] = await db.query("SELECT * FROM rewards WHERE stok > 0")
        const [profile] = await db.query("SELECT * FROM customer WHERE customer_id = ?", [idUser])
        const [history] = await db.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY tanggal_pesanan DESC LIMIT 5', [idUser])
        delete profile[0].customer_id
        delete profile[0].password
        rewards.forEach(reward => {
            delete reward.reward_id
        })
        history.forEach(order => {
            delete order.order_id
            delete order.customer_id
            delete order.restaurant_id
            delete order.driver_id
        });
        res.json({ profile: profile[0], rewards: rewards, history: history })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

export default web;