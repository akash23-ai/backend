import express from "express"
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = express.Router();

// for image video and more using midddleware

// name should be same in frontend as well
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



export default router