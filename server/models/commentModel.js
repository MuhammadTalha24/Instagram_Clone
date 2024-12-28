import mongoose from 'mongoose'

const commentSchema = mongoose.Schema({
    comment: {
        type: String,
        required: true
    },
    commentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    }
})


const Comment = mongoose.Model('Comment', commentSchema)


export default Comment