import express from "express"
import dotenv from "dotenv"
import multer from "multer"
import cookieParser from "cookie-parser"

dotenv.config()
// database
import connectDB from "./config/db.js"

// route
import authRoute from "./routes/authRoute.js"
import productRoute from "./routes/productRoute.js"
const PORT = process.env.PORT || 5000

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(multer().any())
app.use(cookieParser())
connectDB()
app.use(express.json())

app.use('/api/auth', authRoute)
app.use('/api/product', productRoute)
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})