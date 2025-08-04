import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"
import morgan from "morgan"
dotenv.config()
// database
import connectDB from "./config/db.js"

// route
import authRoute from "./routes/authRoute.js"
import productRoute from "./routes/productRoute.js"
import uploadRoute from "./routes/uploadRoute.js"

const PORT = process.env.PORT || 5000

const app = express()

app.use(cors({ credentials: true, origin: 'http://localhost:5173' }))
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.json())
connectDB()

app.use('/api/auth', authRoute)
app.use('/api/product', productRoute)
app.use('/api/upload', uploadRoute)
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})