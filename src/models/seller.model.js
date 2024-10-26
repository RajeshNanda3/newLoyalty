import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const sellerSchema = new Schema(
  {
    username: {
      type: String,
      require: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: { type: String, require: true, lowercase: true, trim: true },
    mobile: { type: Number, require: true, unique: true, index: true },
    password: { type: String, require: [true, "Password is Required"] },
    fullname: { type: String, require: true, lowercase: true, trim: true },
    refreshtoken: { type: String },
    storename: { type: String, require: true, lowercase: true, trim: true },
    marketname: { type: String, require: true, lowercase: true, trim: true },
    district: { type: String, require: true, lowercase: true, trim: true },
    pincode: { type: Number },
    dealswith: [{ type: String, require: true, lowercase: true, trim: true }],
    avatar: { type: String },
    totalbalancepoint: { type: Number, default: 1000 },
  },
  { timestamps: true }
);

sellerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

sellerSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

sellerSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      // for payload item
      _id: this._id,
      mobile: this.mobile,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

sellerSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      // for payload item
      _id: this._id,
      mobile: this.mobile,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Seller = mongoose.model("Seller", sellerSchema);
