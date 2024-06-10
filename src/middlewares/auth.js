import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    const header = req.header('Authorization');
    if (!header) {
        return res.status(400).json({ message: 'Access denied. No token provided.' });
    }
    const token = header.replace('Bearer ', '');
    if (!token) {
        return res.status(400).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.AUTH_TOKEN);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token.', err });
    }
};

export default auth;