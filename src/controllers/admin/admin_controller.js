import Joi from 'joi';
import bcrypt from 'bcryptjs';

import User from '../../models/User.js';
import Tag from '../../models/Tag.js';

import ApiResponse from '../../services/ApiResponse.js';

const login = async(req, res) => {
    const loginSchema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    const { error, value } = loginSchema.validate(req.body);
    if(error) return ApiResponse(res, 400, "Validation failed", { error: error.details.map(detail => detail.message) });

    try {
        const admin = await User.findOne({email: value.email, role: 'admin'});
        if(admin) {
            const passwordMatch = await bcrypt.compare(value.password, admin.password);
            if(passwordMatch) {
                const token = admin.generateAuthToken();
                const refreshToken = admin.generateAuthRefreshToken();
                return ApiResponse(res, 200, "Login successful", {admin, token, refreshToken});
            } else {
                return ApiResponse(res, 401, "Password incorrect");
            }
        } else {
            return ApiResponse(res, 401, "Admin email doesnt exist");
        }
    } catch (err) {
        return ApiResponse(res, 400, "Something went wrong", { error: err.message });
    }
};

const addTag = async(req, res) => {
    try {
        const tagExist = await Tag.findOne({ tagName: req.body.tag });
        if(tagExist) return ApiResponse(res, 409, "This tag already exists");
        const tag = await Tag.create({ tagName: req.body.tag});
        if(tag) {
            return ApiResponse(res, 201, "Tag created successfully", { tag: tag});
        } else {
            return ApiResponse(res, 500, "Something went wrong");
        }
    } catch (e) {
        return ApiResponse(res, 500, "Internal Server Error", e);
    }
}; 

const allTags = async (req, res) => {
    if(!req.user._id) 
        return ApiResponse(res, 403, "User not authenticated");
    try {
        const tags = await Tag.find();
        if( tags.length > 0 )
            return ApiResponse(res, 200, "Tags found", tags);
        else if (tags)
            return ApiResponse(res, 200, "No tags are added", tags);
        else 
            return ApiResponse(res, 400, "Something went wrong");
    } catch (e) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const admin = {
    login,

    addTag,
    allTags
};

export default admin;