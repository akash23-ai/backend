import mongoose from "mongoose";


// can or cannot use the new keyword it works without it
const subscriptionSchema = new mongoose.Schema(
    {
        subscriber : {
            type : mongoose.Schema.Types.ObjectId, // one who is subscribing
            ref : "User"
        },
        channel : {
            type : mongoose.Schema.Types.ObjectId, // one to whom the subscriber is subscribing
            ref : "User"
        }
    },
    {
        timestamps : true
    }
)



export const Subscription = mongoose.model("Subscription", subscriptionSchema);