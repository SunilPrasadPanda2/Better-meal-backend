import jwt from 'jsonwebtoken'

const generateToken = (user) => {
    return jwt.sign(
        { _id: user._id, email: user.email, role: user.role },
        { algorithm: 'HS256', expiresIn: '1h' }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
}

export { generateToken, verifyToken };