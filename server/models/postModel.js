import mongoose from "mongoose";


const postSchema = mongoose.Schema({
    caption: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    comment: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
})


const Post = mongoose.Model('Post', postSchema)
export default Post;