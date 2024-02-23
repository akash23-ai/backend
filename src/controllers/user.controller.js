import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  // check if the user exits
  // take the input from the user
  // validation by zod
  // if image upload it to cloudinary
  // crreate a user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return the user

  // from where i can get the data
  // req.body - if the data is coming from json or form ||  req.header  req.params

  const { username, fullName, email, password } = req.body;
  // console.log(req);

  // some(callback) will return true or false based on the condition
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Field is Required");
  }

  // can see if the email has @ using includes method of string

  // need to pass an object
  // By using $ i can use many operator of mongoose
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // files upload
  // Because of multer i have access to req.files
  // need to console.log(req.files)

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // localPath because it is not uploaded to cloudinary

  // Need to have same name as upload middleware

  //const coverImageLocalPath = req.files?.coverImage[0]?.path;


  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath =  req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    return new ApiError(400, "Avatar is Required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  

  if(!avatar){
    return new ApiError(400, "Avatar is Required")
  }
  

  // create the user in the database takes a object
  // if cover image is there then upload if not then make it ""
   const user = await User.create({
      fullName,
      avatar : avatar.url,
      username : username.toLowerCase(),
      email,
      coverImage : coverImage?.url || "",
      password,
  })

  // This i have done in usermodel.js

//   user.save();

   // in select every field is selected so to remove we use this syntax
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    return new ApiError(500, "SomeThing went wrong while registering user")
  }


  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )



});

// error req, res , next
