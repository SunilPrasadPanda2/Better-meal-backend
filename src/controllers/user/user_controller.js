import Joi from "joi";
import bcrypt from 'bcryptjs';
import logger from '../../utils/logger.js';
import { uploadOnCloudinary } from  '../../utils/cloudinary.js';
import ApiResponse from '../../services/ApiResponse.js';

import User from '../../models/User.js';
import phoneVerification from '../../models/PhoneVerification.js';
 

const sendOtp = async (req, res) => {
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(req.body.phone)) {
        return res.status(400).json({ message: "Please enter 10 digits for mobile number" });
    }

    try {
        const isPhoneExists = await phoneVerification.findOne({ mobileNumber: req.body.phone });

        if (isPhoneExists) {
            const otp = 111111;
            const phoneOtpUpdate = await phoneVerification.updateOne(
                { mobileNumber: req.body.phone },
                { otp: otp }
            );

            if (phoneOtpUpdate.matchedCount === 0) {
                return res.status(404).json({ message: "Phone number not found" });
            }

            return res.status(201).json({ message: "OTP generated successfully", otp: otp });
        } else {
            const phone = await phoneVerification.create({
                mobileNumber: req.body.phone,
                otp: 111111
            });
            return res.status(201).json({ message: "OTP generated successfully", phone });
        }
    } catch (e) {
        return res.status(500).json({ message: "OTP couldn't be generated. Something went wrong", error: e.message });
    }
};

const phoneVerificationOtp = async (req, res) => {
    const phoneNumber = req.body.phone;
    const otp = req.body.otp;
    const phone = await phoneVerification.findOne({ mobileNumber: phoneNumber });
    if (!phone) return res.status(404).json({ message: "phone number was not found" });

    if (phone.otp === otp) {
        return res.status(200).json({ message: "phone number verified" });
    } else {
        return res.status(401).json({ message: "otp does not match" });
    }
}

const signup = async (req, res) => {
    const UserSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        mobile: Joi.string().required(),
        password: Joi.string().required(),
    });

    const { error, value } = UserSchema.validate(req.body);

    if (error) {
        return res.status(500).json({ message: "Validation failed", error: error });
    }

    const isUserExists = await User.findOne({
        $or: [{ email: req.body.email }, { password: req.body.password }]
    });
    if (isUserExists) {
        return res.status(409).json({ message: "User email" });
    }

    try {
        const customer = await User.create(value);
        res.status(201).json({ message: "User created successfully", user: customer });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error });
    }

}

const login = async (req, res) => {
    const LoginSchema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });

    const { error, value } = LoginSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ message: "Validation failed", error });
    }

    try {
        const user = await User.findOne({ email: value.email });
        if (!user) {
            return res.status(401).json({ message: "Authentication failed. User not found." });
        }
        const isMatch = await user.comparePassword(value.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Authentication failed. Wrong password." });
        }
        const token = user.generateAuthToken();
        const refreshToken = user.generateAuthRefreshToken();
        res.status(200).json({ message: "Login successful", user, token, refreshToken });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}

const forgotPassword = async (req, res) => {
    const email = req.body.email;

    const emailExists = await User.findOne({ email: email });
    if (!emailExists) return res.status(404).json({ message: "User not found" });
    // the password reset should go to email.
    return res.status(200).json({ message: "A link has been sent to your mail Id" });
}

const updateProfile = async (req, res) => {
    const userSchema = Joi.object({
        gender: Joi.string().required(),
        weight: Joi.string().required(),
        height: Joi.string().required(),
        dateofbirth: Joi.date().required(),
    });

    const { error, value } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Validation failed", error: error.details });

    const userId = req.user._id;

    try {
        if (!req.file) {
            return res.status(400).json({ message: "Profile picture file is required" });
        }

        // Assume uploadOnCloudinary is a function you've defined to handle Cloudinary uploads
        const profilePicture = await uploadOnCloudinary(req.file.path);

        // Include the profile picture URL in the update
        const updatedData = {
            ...value,
            profilePicture: profilePicture.url  // Assuming the URL is returned from Cloudinary
        };

        const profileUpdate = await User.updateOne(
            { _id: userId },
            { $set: updatedData },
            { new: true }
        );

        if (profileUpdate.modifiedCount === 0) {
            return res.status(404).json({ message: "No profile was updated. User not found." });
        }

        return res.status(200).json({ message: "Profile updated successfully", profile: updatedData });
    } catch (e) {
        return res.status(500).json({ message: "Failed to update profile due to an internal error", error: e.message });
    }
};

const changePassword = async (req, res) => {
    const passwordSchema = Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
        confirmPassword: Joi.string().required().valid(Joi.ref('newPassword'))
    }).messages({
        'any.only': 'Confirm password should be the same as new password'
    });
    const { error, value } = passwordSchema.validate(req.body);
    if(error) return ApiResponse(res, 400, "Validation failed", { error: error.details.map(detail => detail.message)});

    try {
        const user = await User.findOne({ _id: req.user._id});
        if(!user) return ApiResponse(res, 404, "User not found");
        
        const passwordMatch = await bcrypt.compare(value.oldPassword, user.password);
    
        if(passwordMatch) {
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(value.newPassword, salt);
            const userUpdatePassword = await User.updateOne(
                { _id: req.user._id},
                { $set: {password: password}},
            );
            if(userUpdatePassword.modifiedCount > 0) {
                return ApiResponse(res, 200, "Password updated successfully");
            } else {
                return ApiResponse(res, 500, "Something went wrong password could not be updated");
            }
        } else {
            return ApiResponse(res, 200, "Incorrect current password. Please try again.");
        }
    } catch (error) {
        return ApiResponse(res, 500, "Something went wrong");
    }
}



const user = {
    login,
    signup,
    sendOtp,
    phoneVerificationOtp,
    forgotPassword,
    updateProfile,
    changePassword,
};

export default user;