import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// give us the access to body
app.use(
  express.json({
    limit: "16kb",
  })
);

// give us the access to urlencoding and decoding
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

// it will give us the access of public folder
app.use(express.static("public"));

// it will give us the .cookie in response
app.use(cookieParser());

// routes import
// done this like this
import userRouter from "./routes/user.routes.js";

// routes declaration

// this is the syntax

app.use("/api/v1/users", userRouter);

// when somebody writes /users the control will go to userRouter

export { app };
