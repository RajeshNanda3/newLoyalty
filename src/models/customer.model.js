import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const customerSchema = new Schema(
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
    refreshToken: { type: String },
    fullname: { type: String, require: true, lowercase: true, trim: true },
    avatar: { type: String },
    totalbalancepoint: { type: Number, default: 10 },
    referrerid: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      default: "671e2bce420a0400c9971a26",
    },
  },
  { timestamps: true }
);

customerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next()
});

customerSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

customerSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
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

customerSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      mobile: this.mobile,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Customer = mongoose.model("Customer", customerSchema);
