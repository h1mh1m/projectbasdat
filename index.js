import express from "express";
import web from "./route/customer.js";
import { json } from "express";



const app = express()
app.use(express.json())
app.use(web)
app.use(express.urlencoded({ extended: true }))
app.use(json())
app.listen(3000, () => {
    console.log("Server is running on port 3000")
})