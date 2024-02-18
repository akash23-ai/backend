import connectDB from "./db/index.js";
import dotenv from "dotenv"


dotenv.config({
    path: './env'
})


connectDB()




/*
import express from "express"

;( async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error", (error) => {
            console.log("ERROR NOT ABLE TO TALK WIH DATABASE");
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is Listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR", error)
        throw error
    }
})()

*/