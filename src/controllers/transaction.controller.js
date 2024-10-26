import mongoose from "mongoose";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Customer } from "../models/customer.model.js";
import { Seller } from "../models/seller.model.js";

/**
 * Handles loyalty points transaction between seller and customer
 * @async
 * @function handleTransaction
 * @param {express.Request} req - Express request object
 * @param {TransactionBody} req.body - Request body containing transaction details
 * @param {String} req.body.mobile - Cusomter's phone number
 * @param {Number} req.body.balancePoint - Balance point that needs to be transferred
 * @param {Object} req.body.seller - Seller object document form db append via the aut middleware
 * @param {express.Response} res - Express response object
 * @throws {ApiError} When validation fails or transaction cannot be completed
 * @returns {Promise<ApiResponse>} Success response with transaction details
 */
export const handleTransaction = asyncHandler(async (req, res) => {
  const {
    mobile,
    balancePoint,
    seller: { _id: sellerId },
  } = req.body;

  // Input validation
  if (!mobile || !balancePoint || !sellerId) {
    throw new ApiError(400, "Missing required fields");
  }

  if (balancePoint <= 0) {
    throw new ApiError(400, "Balance point must be positive");
  }

  // Start transaction session
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check seller's balance first
    const seller = await Seller.findOne({ _id: sellerId }).session(session);

    if (seller.totalBalancePoint < balancePoint) {
      throw new ApiError(400, "Insufficient balance points");
    }

    // Check if customer exists
    const customer = await Customer.findOne({ mobile }).session(session);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    // Update seller's balance
    const sellerUpdate = await Seller.updateOne(
      { _id: sellerId },
      {
        $inc: {
          totalBalancePoint: -1 * balancePoint,
        },
      },
      { session }
    );

    if (sellerUpdate.modifiedCount !== 1) {
      throw new ApiError(500, "Failed to update seller balance");
    }

    // Update customer's balance
    const customerUpdate = await Customer.updateOne(
      { mobile },
      {
        $inc: {
          totalBalancePoint: balancePoint,
        },
      },
      { session }
    );

    if (customerUpdate.modifiedCount !== 1) {
      throw new ApiError(500, "Failed to update customer balance");
    }

    // Commit the transaction
    await session.commitTransaction();

    // Send success response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transferredPoints: balancePoint,
          seller: sellerId,
          customer: mobile,
        },
        "Points transferred successfully"
      )
    );
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    throw error; // Let the error handler deal with it
  } finally {
    // End session
    session.endSession();
  }
});
