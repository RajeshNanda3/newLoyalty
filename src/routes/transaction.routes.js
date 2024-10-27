import { Router } from "express";
import { handleTransaction } from "../controllers/transaction.controller.js";
import { verifySellerJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Secured routes
router.route("/add").post(verifySellerJWT, handleTransaction);

export default router;
