import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// Because we will gonna do this work again and again so we are making a function for access and Refresh Token

// we are not using async handler because it is a internal request
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    // i need to user validateBeforeSave false because other wise it will check for required field also
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Refresh and Access Token"
    );
  }
};

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
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    return new ApiError(400, "Avatar is Required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    return new ApiError(400, "Avatar is Required");
  }

  // create the user in the database takes a object
  // if cover image is there then upload if not then make it ""
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    username: username.toLowerCase(),
    email,
    coverImage: coverImage?.url || "",
    password,
  });

  // This i have done in usermodel.js

  //   user.save();

  // in select every field is selected so to remove we use this syntax
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    return new ApiError(500, "SomeThing went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

// error req, res , next

export const loginUser = asyncHandler(async (req, res) => {
  // username based or email based
  // Check if user exits
  // password validation
  // then return with response
  // send cookies -> refresh and access

  const { username, email, password } = req.body;
  console.log(email);

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }
  // for finding only with username pr email
  // const isUserExist = await User.findOne({username});

  // for finding any one of email or username
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  // The methods that we have created are present in the user that we have created not the User of mongoose

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is Wrong");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // can make another database call or can update the current users field

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send this in cookies
  // for sending cookie i need to design some option object

  // httpOnly make the cokkie only modifiable from server not from frontend
  // By deafault they are modifiable from both frontend and server
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
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

// can access cookie in req, res both

export const logoutUser = asyncHandler(async (req, res) => {
  // clear the cookies
  // remove the refresh Token

  const id = req.user._id;
  // these functions came from mongoose
  const user = await User.findByIdAndUpdate(
    id,
    {
      // $set: {
      //   refreshToken: undefined,  // this will not remove the field

      // },

      $unset: {
        refreshToken: 1, // this will remove the field
      },
    },
    {
      new: true,
    }
  );

  console.log(user);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out SuccessFully"));

  // To handle how to find user we will use middleware
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  // can access the refresh token from the cookie of the request
  // need to check if the token is same as in database
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "UnAthorized Request");
  }

  try {
    // Why because the token that user got is a encrypted token that is diffrent from the database token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh Token is Invalid");
    }

    const { accessToken, newRefreshToken } =
      await user.generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            newRefreshToken,
          },
          "AccessToken is Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // how to find the user  => Through middleware
  const id = req?.user._id;

  const user = await User.findById(id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed SuccessFully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req?.user;

  return res.status(200).json(new ApiResponse(200, { user }, "User is there"));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if(!fullName && !email){
    throw new ApiError(400,"All fields are requuired")
  }

  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set : {
        fullName,
        email
      }
    },
    {new : true}
    ).select("-password")  // it is a javascript method

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated successfully"))

});


// changing the file in this controller
export const updateUserAvatar = asyncHandler(async(req, res) => {
  // upload to cloudinary

      const localAvatarPath = req.file?.path // from multer middleware
      // above we have done req.files because we were uploading multiple file there so thats why we are calling it as files

      if(!localAvatarPath){
        throw new ApiError(400, "Avatar file is Missing")
      }


      // TODO delete old image
      
      const uploadedAvatar = await uploadOnCloudinary(localAvatarPath)

        if(!uploadedAvatar.url) throw new ApiError(400, "Error while Uploading on avatar")

      
     // const user = await User.findById(req?.user._id);
    //  user.avatar = uploadedAvatar.url;

    // or 

    const user = await User.findByIdAndUpdate(
      req?.user._id, 
      {
        $set : {
          avatar : uploadedAvatar.url
        }
      },
      {
        new : true
      }
    ).select("-password")

      return res.status(200).json(new ApiResponse(200, user, "Avatar is Uploaded"))
})

export const updateUserCover = asyncHandler(async(req, res) => {
  const localCoverPath = req.file?.path;

  if(!localCoverPath) throw new ApiError(400, "Cover File is Required")

  const uploadedCover = await uploadOnCloudinary(localCoverPath);

  if(!uploadedCover.url){
    throw new ApiError(400, "Error while Uploading the coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set : {
        coverImage : uploadedCover
      }
    },
    {
      new : true
    }
  ).select("-password")

  return res.status(200).json(new ApiResponse(200, user, "Cover Image is Uploaded"))
})


export const deleteCover = asyncHandler(async(req, res) => {
  const user = await User.findById(req.user?._id);

  if(!user) throw ApiError(404, "User Not Found")

  const avatar = user.avatar;

  const imageData = await deleteFromCloudinary(avatar)

  if(!imageData) {
    throw new ApiError(404, "Not Found")
  }

  return res.status(200).json(new ApiResponse(200, imageData, "SuccessFully Deleted the image"))

})



// watch this controller again
export const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {username} = req.params;

  if(!username?.trim()) throw new ApiError(400, "Username is Missing")

  // type of return is array
  const channel = await User.aggregate([
    {
      $match : {
        username : username?.toLowerCase()
      }
    }, 
    {
      $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField : "channel",
        as : "subscribers"
      }
    },
    {
      $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField : "subscriber",
        as : "subscribedTo" 
      }
    },
    {
      $addFields : {
        subscribersCount : {
          $size : "$subscribers"
        },
        channelSubscribedToCount : {
          $size : "subscribedTo"
        },
        isSubscribed : {
          $cond : {
            if : {$in : [req.user?._id, "$subscribers.subscriber"]},
            then : true,
            else : false
          }
        }
      }
    },
    {
      $project : {
        fullName : 1,
        username : 1,
        subscribersCount : 1,
        channelSubscribedToCount : 1,
        isSubscribed : 1,
        avatar : 1,
        coverImage : 1,
        email : 1
      }
    }
  ]);


  if(!channel?.length){
    throw new ApiError(404, "Channel does not exits")
  }
  // it returns array of values
  console.log(channel)

  return res.status(200).json(new ApiResponse(200, channel[0], "User Channel fetched successfully"))

})



// export const changeId = asyncHandler(async(req, res) => {
//     const user = await User.findById(
//       req.user?._id)

//       user._id = 1;

//       console.log(user._id)
    

//       return res.status(200).json(new ApiResponse(200, user, "New User"))
// })

