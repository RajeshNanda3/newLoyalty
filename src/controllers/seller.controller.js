import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Seller } from "../models/seller.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (sellerId) => {
  try {
    const seller = await Seller.findById(sellerId);
    const accessToken = await seller.generateAccessToken();
    const refreshToken = await seller.generateRefreshToken();

    seller.refreshtoken = refreshToken;
    await seller.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something Went Wrong While Generating Refresh And Access Token"
    );
  }
};

const registerSeller = asyncHandler(async (req, res) => {
  // res.status(200).json({})
  // message : "ok"
  // get seller details from frontend
  // validation - not empty
  // check if seller already exists : username, mobile
  // check for images, check for avtar
  // upload them to cloudinay, avtar
  // create seller object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const {
    avatar,
    fullname,
    email,
    username,
    password,
    mobile,
    totalbalancepoint,
  } = req.body;

  // if (fullname===""){
  //    throw new ApiError(400, "fullname is required")
  // }
  if (
    [
      avatar,
      fullname,
      email,
      username,
      password,
      mobile,
      totalbalancepoint,
    ].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All feilds are mandatory");
  }
  // checking seller already exist or not
  const existedSeller = await Seller.findOne({
    $or: [{ username }, { mobile }],
  });
  if (existedSeller) {
    throw new ApiError(409, "Entered username or mobile is alresdy exist");
  }

  // handling images
  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required1222");
  }

  // uploading image on cloudinary through ../utils/cloudinay.js
  const profileimage = await uploadOnCloudinary(avatarLocalPath);

  if (!profileimage) {
    throw new ApiError(400, "Avatar file is required5555");
  }

  const seller = await Seller.create({
    fullname,
    avatar: profileimage.url,
    email,
    password,
    mobile,
    totalbalancepoint,
    username: username.toLowerCase(),
  });
  seller.refreshtoken = await seller.generateRefreshToken();
  seller.save();

  const createdSeller = await Seller.findById(seller._id).select(
    "-password -refreshtoken"
  );
  if (!createdSeller) {
    throw new ApiError(500, "Something Went Wrong While Rgistering  the User");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdSeller, "User Registered Successfully"));
});

const loginSeller = asyncHandler(async (req, res) => {
  // req.body = > data
  // username or mobile
  // find the user
  // password check
  // access and refresh token
  // send cookie
  // send response
  const { username, mobile, password } = req.body;
  if (!(username || mobile)) {
    throw new ApiError(400, "Username or Mobile is Required");
  }
  const seller = await Seller.findOne({
    $or: [{ username }, { mobile }],
  });
  if (!seller) {
    throw new ApiError(404, "User does not Exist");
  }

  const isPasswordValid = await seller.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid user Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    seller._id
  );

  const loggedInSeller = await Seller.findById(seller._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          seller: loggedInSeller,
          accessToken,
          refreshToken,
        },
        "Seller loggedin Successfully"
      )
    );
});

const logoutSeller = asyncHandler(async (req, res) => {
  await Seller.findByIdAndDelete(
    req.seller._id,
    {
      $set: {
        refreshtoken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export { registerSeller, loginSeller, logoutSeller };
