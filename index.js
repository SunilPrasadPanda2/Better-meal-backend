import connectDB from "./src/db/index.js";
import app from "./src/app.js";
import dotenv from 'dotenv';
import logger from "./src/utils/logger.js";

dotenv.config({
    path: './.env'
});

connectDB().then(() => {
    app.listen(5000, () => logger.info(`server running on ${process.env.BASEURL}`));
}).catch(() => {
    logger.error(`Database not connected: ${err.message}`);
});