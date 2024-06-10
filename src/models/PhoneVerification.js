import mongoose, { Schema } from 'mongoose';

const phoneVerificationSchema = new Schema(
    {
        mobileNumber: {
            type: String,
            required: true,
            unique: true,
            match: [/^\d{10}$/]
        },
        otp: {
            type: String,
            required: false,
            allowNull: true,
            match: [/^\d{6}$/]
        }
    }
);

const phoneVerification = mongoose.model('PhoneVerification', phoneVerificationSchema);

export default phoneVerification;