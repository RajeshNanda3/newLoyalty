import { Router } from "express";
import { loginSeller, logoutSeller, registerSeller } from "../controllers/seller.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifySellerJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name : "avatar",
      maxCount : 1
    }
  ]),
  registerSeller
);

router.route("/login").post(loginSeller)

// Secured routes
router.route("/logout").post(verifySellerJWT, logoutSeller)

export default router;
