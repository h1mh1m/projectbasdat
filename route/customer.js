import express from "express";
import makankuy from "../DB/db.js";

const web = express.Router()
const db = makankuy.db;

web.get("/", async (req, res) => {
    try {
        const [restaurants] = await db.query("SELECT * FROM restaurant")
        res.json(restaurants)

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

web.post("/", async (req, res) => {
    try {
        const { nama_restoran} = req.body
        const [result] = await db.query("SELECT * FROM restaurant WHERE nama_restaurant= ? OR kategori = ?", [nama_restoran, nama_restoran])
        res.json(result).status(200)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});
web.get("/restaurant", async (req, res)=> {
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
web.post("/restaurant", async (req, res) => {
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
web.get("/restaurant/:id", async (req, res) => {
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
web.get("/cart", async (req, res) => {
    try {
        
    } catch (error) {
        
    }
});

export default web;