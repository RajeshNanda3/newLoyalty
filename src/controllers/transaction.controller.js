// import mongoose from "mongoose";

// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { Customer } from "../models/customer.model.js";
// import { Seller } from "../models/seller.model.js";

// /**
//  * Handles loyalty points transaction between seller and customer
//  * @async
//  * @function handleTransaction
//  * @param {express.Request} req - Express request object
//  * @param {TransactionBody} req.body - Request body containing transaction details
//  * @param {String} req.body.mobile - Cusomter's phone number
//  * @param {Number} req.body.balancePoint - Balance point that needs to be transferred
//  * @param {Object} req.body.seller - Seller object document form db append via the aut middleware
//  * @param {express.Response} res - Express response object
//  * @throws {ApiError} When validation fails or transaction cannot be completed
//  * @returns {Promise<ApiResponse>} Success response with transaction details
//  */



// export const handleTransaction = asyncHandler(async (req, res) => {
//   // console.log(req.body)
//   let {
//     mobile,
//     balancepoint,
    
//   } = req.body;
//   const balancePoint = Number(balancepoint)
 
// // console.log(typeof(balancePoint))

//   const sellerId =( req.seller._id).toString()
//   console.log(sellerId, mobile, balancePoint)
//   // Input validation
//   if (!mobile || !balancePoint || !sellerId) {
//     throw new ApiError(400, "Missing required fields");
//   }

//   if (balancePoint <= 0) {
//     throw new ApiError(400, "Balance point must be positive");
//   }

//   // Start transaction session
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     // Check seller's balance first
//     const seller = await Seller.findOne({ _id: sellerId }).session(session);

//     // console.log(seller, mobile, balancePoint);
    

//     if (seller.totalBalancePoint < balancePoint) {
//       throw new ApiError(400, "Insufficient balance points");
//     }

//     // Check if customer exists
//     const receiver = await Customer.findOne({ mobile }, {session}).session(session);
// // console.log(receiver)
//     if (!receiver) {
//       throw new ApiError(404, "Receiver not foundzzz");
//     }

//     const totalBalancePointTransaction = -1 * balancePoint
//     //  console.log(totalBalancePointTransaction, "Balance");
//     /* Update seller's balance
//     const sellerUpdate = await Seller.updateOne(
//       { _id: sellerId },
//       {
//         $inc: {
//           totalBalancePoint:totalBalancePointTransaction ,
//         },
//       },
//       { session }
//     );
//     */
//    const sellerUpdate = await Seller.findByIdAndUpdate(
//      sellerId ,
//       {
//         $inc: {
//           totalBalancePoint:totalBalancePointTransaction ,
//         },
//       },
//       { session }
//    )
    
//  console.log(sellerUpdate, "Updated", total);
//     // if (sellerUpdate.modifiedCount !== 1) {
//     //   throw new ApiError(500, "Failed to update seller balance");
//     // }

//     // Update customer's balance  
//     const customerUpdate = await Customer.updateOne(
//       { mobile },
//       {
//         $inc: {
//           totalBalancePoint: balancePoint,
//         },
//       },
//       { session }
//     );

//     if (customerUpdate.modifiedCount !== 1) {
//       throw new ApiError(500, "Failed to update customer balance");
//     }
//     console.log(customerUpdate);

//     // Commit the transaction
//    const response =  await session.commitTransaction();
// // console.log(response)

//     // Send success response
//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           transferredPoints: balancePoint,
//           seller: sellerId,
//           customer: mobile,
//         },
//         "Points transferred successfully"
//       )
//     );
//   } catch (error) {
//     // Abort transaction on error
//     await session.abortTransaction();
//     throw error; // Let the error handler deal with it
//   } finally {
//     // End session
//     session.endSession();
//   }
// });
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Customer } from "../models/customer.model.js";
import { Seller } from "../models/seller.model.js";
import { Transaction } from "../models/transaction.model.js";

/**
 * Handles loyalty points transaction between seller and customer
 * @async
 * @function handleTransaction
 * @param {express.Request} req - Express request object
 * @param {Object} req.body - Request body containing transaction details
 * @param {String} req.body.mobile - Customer's phone number
 * @param {Number} req.body.balancepoint - Points to be transferred (parsed to balancePoint)
 * @param {Object} req.seller - Seller object from db, appended via auth middleware
 * @param {express.Response} res - Express response object
 * @throws {ApiError} If validation fails or transaction cannot be completed
 * @returns {Promise<ApiResponse>} Success response with transaction details
 */
export const handleTransaction = asyncHandler(async (req, res) => {
  // Debug logs to check incoming request data
  // console.log("Request Body:", req.body);
  // console.log("Seller Info:", req.seller);

  const { mobile, balancepoint } = req.body;
  const balancePoint = Number(balancepoint); // Convert balancepoint to a numeric value
  const sellerId = req.seller?._id?.toString();

  // Input validation
  if (!mobile || !balancePoint || !sellerId) {
    console.log("Missing Fields:", { mobile, balancePoint, sellerId }); // Debugging missing fields
    throw new ApiError(400, "Missing required fields");
  }

  if (balancePoint <= 0) {
    throw new ApiError(400, "Balance points must be positive");
  }

  // Start a transaction session
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Step 1: Check seller's balance
    const seller = await Seller.findById(sellerId).session(session);
    if (!seller || seller.totalBalancePoint < balancePoint) {
      throw new ApiError(400, "Insufficient balance points");
    }

    // Step 2: Check if customer exists
    const receiver = await Customer.findOne({ mobile }).session(session);
    if (!receiver) {
      throw new ApiError(404, "Customer not found");
    }

   

    // Step 3: Update seller's balance by decrementing points
    const sellerUpdate = await Seller.updateOne(
      {_id : sellerId},
      { $inc: { totalbalancepoint: -balancePoint } },
      { session }
    );

    if (!sellerUpdate) {
      throw new ApiError(500, "Failed to update seller balance");
    }

    // Step 4: Update customer's balance by incrementing points
    const customerUpdate = await Customer.updateOne(
      { mobile },
      { $inc: { totalbalancepoint: balancePoint } },
      { session }
    );

    if (customerUpdate.modifiedCount !== 1) {
      throw new ApiError(500, "Failed to update customer balance");
    }
const transaction = await Transaction.create({
  senderid : sellerId,
  receiverid : receiver._id,
  point : balancePoint
})
    
    // Commit the transaction
    await session.commitTransaction();

    // Send success response with transaction details
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
    // Abort the transaction if any error occurs
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session to clean up
    session.endSession();
  }
});

