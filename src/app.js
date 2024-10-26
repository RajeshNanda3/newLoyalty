import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
  origin : process.env.CORS_ORIGIN,
  credentials : true
}))

app.use(express.json({limit :"16kb"}))
// for url data configurartion
app.use(express.urlencoded({extended: true, limit: "16kb"}))
// static file configuration
app.use(express.static("public"))
// cookie-parser configuration
app.use(cookieParser())


// routes import
import sellerRouter from "./routes/seller.routes.js"
import customerRouter from "./routes/customer.routes.js"
import transactionRouter from "./routes/transaction.routes.js"



// routes declaration
app.use("/api/v1/sellers", sellerRouter)
app.use("/api/v1/customers", customerRouter)
app.use("/api/v1/transaction", transactionRouter)




export {app}
