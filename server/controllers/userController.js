import User from '../models/userModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import getDataUri from '../utils/dataUri.js'
import cloudinary from '../utils/cloudinary.js'

export const register = async (req, res) => {
    try {
        const { email, password, username } = req.body
        if (!email || !password || !username) {
            return res.status(401).json({
                message: "All Fields Are Required",
                success: false
            })
        }


        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "Email Already in use",
                success: false
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        await User.create({
            email, password: hashedPassword, username
        })

        return res.status(201).json({
            message: "Registeration Successfully",
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}



export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "All Fields Are Required",
                success: false
            })
        }

        let user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({
                message: "User not found",
                success: false
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid Password",
                success: false
            })
        }


        const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
            expiresIn: "1d"
        })

        user = {
            username: user.username,
            email: user.email,
            bio: user.bio,
            profilePic: user.profilePic,
            followers: user.followers,
            following: user.following,
            posts: user.posts
        }

        return res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 1 * 24 * 60 * 60 * 1000
        }).status(201).json({
            success: true,
            message: `Welcome Back ${user.username}`,
            user
        })


    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}


export const logout = async (req, res) => {
    try {
        return res.cookie('token', '', { maxAge: 0 }).status(201).json({
            message: "Logout Successfully",
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}


export const getProfile = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({
                message: "User Not Found!",
                success: false
            })
        }

        return res.status(200).json({
            success: true,
            user
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}


export const editProfile = async (req, res) => {
    try {
        const { bio, gender, username } = req.body;
        const profilePic = req.file;
        const userId = req.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User Not Found!",
                success: false,
            });
        }

        let cloudResponse;
        if (profilePic) {
            try {
                const fileUri = getDataUri(profilePic);
                cloudResponse = await cloudinary.uploader.upload(fileUri);

            } catch (uploadError) {
                return res.status(500).json({
                    message: "Error uploading profile picture.",
                    success: false,
                });
            }
        }


        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (username) user.username = username;
        if (profilePic && cloudResponse?.secure_url) user.profilePic = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: "Profile Updated Successfully",
            success: true,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};



export const getSuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");
        if (!suggestedUsers) {
            return res.status(401).json({
                message: "Currently Do Not Have Any Users",
                success: false
            })
        }


        return res.status(201).json({
            users: suggestedUsers,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}

export const followOrUnfollow = async (req, res) => {
    try {
        const personWhoFollow = req.id;
        const personWhoFollowed = req.params.id;
        if (personWhoFollow == personWhoFollowed) {
            return res.status(500).json({
                message: "You Cannot Follow Yourself",
                success: false
            })
        }

        const user = await User.findById(personWhoFollow);
        const otherUser = await User.findById(personWhoFollowed);

        if (!user || !otherUser) {
            return res.status(500).json({
                message: "User not Found",
                success: false
            })
        }



        if (user.following.includes(personWhoFollowed)) {

            await Promise.all([
                User.updateOne({ _id: personWhoFollow }, { $pull: { following: personWhoFollowed } }),
                User.updateOne({ _id: personWhoFollowed }, { $pull: { followers: personWhoFollow } })
            ])
            return res.status(201).json({
                message: "Unfollowed Successfully",
                success: true
            })
        } else {
            await Promise.all([
                User.updateOne({ _id: personWhoFollow }, { $push: { following: personWhoFollowed } }),
                User.updateOne({ _id: personWhoFollowed }, { $push: { followers: personWhoFollow } }),
            ])

            return res.status(201).json({
                message: "follow Successfully",
                success: true
            })
        }

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}


