import express from "express";
import makankuy from "../DB/db.js";

const customer = express.Router()
const db = makankuy.db;
customer.get("/customer/profile/:customerId", async (req, res) => {
    const customer_id = req.params.customerId
    try {
        const [rows, field] = await db.query("SELECT nama,email,nomor_telepon,total_poin FROM customer WHERE customer_id = ?", [customer_id])
        res.status(200).json(rows)
    } catch (error) {
        res.status(500).json({
            message: "Error fetching profile",
            error: error.message
        });
    }
})
customer.get("/customer/history/:customerId", async (req, res) => {
    const { customerId } = req.params.customerId
    try {
        const [rows, field] = await db.query("SELECT * FROM order_history WHERE customer_id = ?", [customerId])
        res.status(200).json(rows)
    } catch (error) {
        res.status(500).json({
            message: "Error fetching order history",
            error: error.message
        });
    }
})
customer.get("/customer/order", async (req, res) => {
    try {
        const [rows, field] = await db.query("SELECT * FROM restaurants")
        res.status(200).json(rows)
    } catch (error) {
        res.status(500).json({
            message: "Error fetching restaurants",
            error: error.message
        });
    }
})    
customer.get("/customer/order/:restaurantId", async (req, res) => {
    const restaurant_id = req.params.restaurantId
    try {
        const [rows, field] = await db.query("SELECT * FROM menus WHERE restaurant_id = ?", [restaurant_id])
        res.status(200).json(rows)
    } catch (error) {
        res.status(500).json({
            message: "Error fetching menu",
            error: error.message
        })
    }
})
customer.get("/customer/order/:restaurantId/:menuId", async (req, res) => {
    const { restaurantId, menuId } = req.params
    try {
        const [rows, field] = await db.query("SELECT * FROM menus WHERE restaurant_id = ? AND menu_id = ?", [restaurantId, menuId])
        res.status(200).json(rows)
    } catch (error) {
        res.status(500).json({
            message: "Error fetching menu details",
            error: error.message
        })
    }
})
customer.post("")
export default customer;