import express from "express"
import { loginUser, logoutUser, refreshAccessToken, registerUser, updateUserCover, deleteCover } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = express.Router();

// for image video and more using midddleware

// name should be same in frontend as well
// this is one of the syntax for router
router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount :  1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

// secured routes 

router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refreshToken").post(refreshAccessToken)

router.route("/updateCover").post(verifyJwt, updateUserCover)

router.route("/delete").get(verifyJwt, deleteCover)


// router.route("/change").get(verifyJwt, changeId)
export default router