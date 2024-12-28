import sharp from 'sharp'
import cloudinary from 'cloudinary'
import Post from '../models/postModel.js';
import User from '../models/userModel.js'
import Comment from '../models/commentModel.js';


export const createPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;


        if (!caption) {
            return res.status(404).json({
                message: "Caption is required",
                success: false
            })
        }

        if (!image) {
            return res.status(404).json({
                message: "Image is Required",
                success: false
            })
        }


        const optimizedImageBuffer = await sharp(image.buffer).resize({ width: 800, height: 800, fit: 'inside' }).toFormat('jpeg', { quality: 80 }).toBuffer();
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);


        const post = await Post.create({
            caption,
            image: cloudResponse?.secure_url,
            author: req.id
        })


        const user = await User.findById(req.id);
        if (post) {
            user.posts.push(post._id);
            await user.save();
        }

        await post.populate({ path: "author", select: "-password" })

        return res.status(201).json({
            message: "Post Created Successfully",
            success: true,
            post
        })




    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}

export const getAllPost = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePic' })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: {
                    path: "commentedBy",
                    select: 'username profilePic'
                }
            })

        return res.status(201).json({
            posts,
            success: true
        })


    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}


export const getMyPosts = async (req, res) => {
    try {
        const myPosts = await Post.find({ author: req.id }).sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username,profilePic' })
            .populate({
                path: 'comments', sort: { createdAt: -1 }, populate: {
                    path: "commentedBy", select: "username profilePic"
                }
            });
        return res.status(200).json({
            myPosts,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}


export const likePost = async (req, res) => {
    try {
        const personWhoLike = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post Not Found",
                success: false
            })
        }

        await post.updateOne({ $addToSet: { likes: personWhoLike } })
        await post.save();
        //implement socket.io for real time notifications

        return res.status(200).json({
            message: "Post Liked",
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}


export const unlikePost = async (req, res) => {
    const userId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json({
            message: "Post Not Found",
            success: false
        })
    }

    await post.updateOne({ $pull: { likes: userId } })
    await post.save();

    return res.status(200).json({
        message: "Post Unliked",
        success: true
    })

}

export const addComment = async (req, res) => {
    try {
        const { comment } = req.body;
        const postId = req.params.id;
        const userId = req.id;


        if (!comment) {
            return res.status(400).json({
                message: "Comment is required",
                success: false,
            });
        }


        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }


        const newComment = await Comment.create({
            comment,
            commentedBy: userId,
            post: postId,
        });


        const populatedComment = await Comment.findById(newComment._id).populate({
            path: "commentedBy",
            select: "username profilePic",
        });

        await Post.findByIdAndUpdate(postId, {
            $push: { comments: newComment._id },
        });

        return res.status(200).json({
            message: "Comment added successfully",
            success: true,
            comment: populatedComment,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const comment = await Comment.findByIdAndDelete(commentId);

        if (!comment) {
            return res.status(400).json({
                message: "Comment Not Found",
                success: false
            })
        }

        await Post.findByIdAndUpdate(comment.post, { $pull: { comments: commentId } })

        return res.status(200).json({
            message: "Comment deleted successfully",
            success: true,
        });


    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
}



export const getAllPostComments = async (req, res) => {
    try {
        const postId = req.params.id;
        const comments = await Comment.find({ post: postId }).sort({ createdAt: -1 }).populate({
            path: 'commentedBy',
            select: 'username profilePic'
        })

        if (!comments) {
            return res.status(400).json({
                message: "No comments related to this post",
                success: false
            })
        }

        return res.status(200).json({
            success: true,
            comments
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
}


export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.id;
        const post = await Post.findByIdAndDelete(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post Not Found",
                success: false
            })
        }

        await User.findByIdAndUpdate(userId, {
            $pull: { posts: postId }
        })

        await Comment.deleteMany({ post: postId })
        return res.status(200).json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
}


export const bookmarkPost = async (req, res) => {
    try {
        const userId = req.id;
        const postId = req.params.id;
        const user = await User.findById(userId);
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(400).json({
                message: "Post not found",
                success: false
            })
        }

        if (user.bookmarks.includes(post._id)) {
            await user.updateOne({ $pull: { bookmarks: post._id } })
            await user.save();
            return res.status(200).json({ type: 'unsaved', message: "Post removed from bookmarks", success: true })
        } else {
            await user.updateOne({ $addToSet: { bookmarks: post._id } })
            await user.save();
            return res.status(200).json({ type: 'saved', message: "Post added to bookmarks", success: true })

        }
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
}





