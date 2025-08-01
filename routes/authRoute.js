import express from "express"
import { login, logout, register } from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"
const router = express.Router()

router.post('/', register)
router.post('/login', login)
router.use(protect).get('/logout', logout)

export default router