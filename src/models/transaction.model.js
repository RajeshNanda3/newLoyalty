import mongoose, {Schema} from "mongoose"

const transactionSchema = new Schema(
  {
    senderid:{type: Schema.Types.ObjectId,
      ref :"Seller"
    },
    receiverid: {
      type : Schema.Types.ObjectId,
      ref : "Customer"
    },
    point :{type :Number, require :true}

    

  },{timestamps :true})

export const Transaction = mongoose.model("Transaction",transactionSchema)