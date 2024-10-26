import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Customer } from "../models/customer.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (customerId) => {
  try {
    const customer = await Customer.findById(customerId);
    const accessToken = await customer.generateAccessToken();
    const refreshToken = await customer.generateRefreshToken();

    customer.refreshtoken = refreshToken;
    await customer.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something Went Wrong While Generating Refresh And Access Token"
    );
  }
};

const registerCustomer = asyncHandler(async (req, res) => {
  // get customer details from frontend
  // validation for not empty
  // check customer is already exist : username, mobile
  // check for images, check for avtar
  // upload them to cloudinary, avtar
  // create customer object and create entry in db
  // remove password and refresh token feild from response
  // check for customer creation
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
    throw new ApiError(400, "Please provide data in all feilds");
  }

  // checking customer already exist or not
  const existedCustomer = await Customer.findOne({
    $or: [{ username }, { mobile }],
  });

  if (existedCustomer) {
    throw new ApiError(
      409,
      "This username or mobile is already exist, please try another one"
    );
    // return res.send(existedCustomer)
  }

  // handling images
  const profImageLocalPath = req.files?.avatar[0]?.path;

  if (!profImageLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // uploading image on clodinary through cloudinary
  const profileimage = await uploadOnCloudinary(profImageLocalPath);
  if (!profileimage) {
    throw new ApiError(400, "Profile Image is required");
  }
  // create customer object
  const customer = await Customer.create({
    fullname,
    avatar: profileimage.url,
    email,
    password,
    mobile,
    totalbalancepoint,
    username: username.toLowerCase(),
  });
  customer.refreshToken = await customer.generateRefreshToken();
  customer.save();

  const createdCustomer = await Customer.findById(customer._id).select(
    "-password -refreshtoken"
  );
  if (!createdCustomer) {
    throw new ApiError(500, "Something went wrong while Registering the user");
  }
  return res
    .status(201)
    .json(
      new ApiResponse(200, createdCustomer, "User Registered Successfully")
    );
});

const loginCustomer = asyncHandler(async (req, res) => {
  // get data from req.body
  // username or mobile
  // find the user
  // password check
  // access and refresh token
  // send cookie
  // send response
  const { username, mobile, password } = req.body;
  if (!(username || mobile)) {
    throw new ApiError(400, "Username or Mobile ie Required");
  }
  const customer = await Customer.findOne({
    $or: [{ username }, { mobile }],
  });
  if (!customer) {
    throw new ApiError(401, "User does not exist");
  }
  // match password

  const isPasswordValid = await customer.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid Credentials");
  }
  // setting Access and Refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    customer._id
  );

  const loggedInCustomer = await Customer.findById(customer._id).select(
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
          customer: loggedInCustomer,
          accessToken,
          refreshToken,
        },
        "Customer loggedin Successfully"
      )
    );
});
// logout controller
const logoutCustomer = asyncHandler(async(req,res)=>{
  await Customer.findByIdAndUpdate(
    req.customer._id,
    {
      $set :{
        refreshtoken : undefined
      }
    },{
      new : true
    }
  )
  const options = {
    httpOnly : true,
    secure : true
  }
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "You logged out successfully"))
})

export { registerCustomer, loginCustomer,logoutCustomer };
