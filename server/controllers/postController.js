import sharp from 'sharp'
import cloudinary from 'cloudinary'
import Post from '../models/postModel.js';
import User from '../models/userModel.js'

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