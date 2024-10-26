import { Router } from "express";
import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
} from "../controllers/customer.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyCustomerJWT } from "../middlewares/auth.middleware.js";
// import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerCustomer
);
router.route("/login").post(loginCustomer);
// secure routes
router.route("/logout").post(verifyCustomerJWT, logoutCustomer);
export default router;
