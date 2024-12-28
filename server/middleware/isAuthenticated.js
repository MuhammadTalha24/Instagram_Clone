import jwt from 'jsonwebtoken';

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "User Not Authenticated"
            })
        }

        const decode = jwt.verify(token, process.env.JWT_KEY);
        if (!decode) {
            return res.status(401).json({
                success: false,
                message: "User is not authorized"
            })
        }

        req.id = decode.userId;
        next()
    } catch (error) {
        console.log(error)
    }
}


export default isAuthenticated;