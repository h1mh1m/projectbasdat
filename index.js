import express from "express";
import customer from "./route/customer.js";
import { json } from "express";



const app = express()
app.use(express.json())
app.use(customer)
app.use(express.urlencoded({ extended: true }))
app.use(json())
app.listen(3000, () => {
    console.log("Server is running on port 3000")
})