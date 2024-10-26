import { Customer } from "../models/customer.model.js";
import { Seller } from "../models/seller.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifySellerJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization ")?.replace("Bearer ", "");
    console.log("token", token);

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const seller = await Seller.findById(decodedToken?._id).select(
      "-password -refreshtoken"
    );

    if (!seller) {
      throw new ApiError(401, "Invalid Acess Token");
    }
    req.seller = seller;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

// auth for customer
export const verifyCustomerJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");
    console.log("token", token);
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const customer = await Customer.findById(decodedToken?._id).select(
      "-password -refreshtoken"
    );
    if (!customer) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.customer = customer;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid access token");
  }
});
