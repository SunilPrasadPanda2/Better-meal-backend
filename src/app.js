import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';

import user from './routes/user_route.js';
import admin from './routes/admin_route.js';
import ApiResponse from './services/ApiResponse.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/user', user);

app.use('/admin', admin);

app.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return ApiResponse(res, 401, "No refersh token provided");
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN,
        (err, user) => {
            if (err) return res.sendStatus(403);
            const token = jwt.sign({ _id: user._id, role: user.role }, process.env.AUTH_TOKEN, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ _id: this._id, email: this.email, role: this.role },process.env.REFRESH_TOKEN,{ algorithm: 'HS256', expiresIn: '7d' });
            res.json({ token, refreshToken });
        }
    );
});

export default app;