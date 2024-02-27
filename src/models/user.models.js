import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"


//Both are valid and returns a new instance of the Mongoose.Schema class. What 
//this means is that both does exactly the same.

const userSchema = new mongoose.Schema(
    {
        watchHistory : [{
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"
        }],
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true
        },
        fullName : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String, // Cloudinary URL  Object store like S3
            required : true
        },
        coverImage : {
            type : String // Cloudinary
        },
        password : {
            type : String,
            required : [true, 'Password is Required']
        },
        refreshToken : {
            type : String,
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) { // because this is a middleware
    if(!this.isModified("password")) return next()
    
    this.password = await bcrypt.hash(this.password, 10)
    next();
})



userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password) // methods have access of this.password
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET, {expiresIn : process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET, {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
} // this is refresh Token


export const User = mongoose.model("User", userSchema)