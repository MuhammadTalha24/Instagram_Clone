import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import env from 'dotenv'
import dbConnection from './utils/dbConnection.js'
import userRoutes from './routes/userRoutes.js'
const app = express()
env.config()
const PORT = process.env.PORT


//middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser())


//routes
app.use('/api/v1/user', userRoutes);



app.listen(PORT, () => {
    dbConnection()
    console.log(`Server Running At ${PORT}`)
})