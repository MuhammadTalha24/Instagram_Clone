import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }
})

const Conversation = mongoose.model("Conversation", conversationSchema)
export default Conversation;