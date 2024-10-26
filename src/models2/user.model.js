import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      require: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: { type: String, require: true, lowercase: true, trim: true },
    mobile: { type: Number, require: true, unique: true, index: true },
    password: { type: String, require: true },
    role: { type: String, enum: [seller, customer, admin], require: true },
    fullname: { type: String, require: true, lowercase: true, trim: true },
    avatar: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
