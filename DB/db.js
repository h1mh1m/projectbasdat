import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const db = mysql.createPool({
    host:process.env.DB_HOST, 
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
})
db.getConnection()
    .then(() => console.log("Can Connect with database"))
    .catch((err) => console.log("Cannot connect with database:", err.message))

const DB = {
    query: async (text, params) => {
        try {
            const [results] = await db.query(text, params)
            return results
        } catch (error) {
            console.error("Database query error:", error.message)
            throw error
        }
    }
}

export default {
    db,
    DB,
}







