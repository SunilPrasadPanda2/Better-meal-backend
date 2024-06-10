import Joi from 'joi';
import ApiResponse from '../../services/ApiResponse.js';

import Faq from '../../models/Faq.js';

const allfaqs = async (req, res) => {
    if(!req.user._id) return ApiResponse(res, 404, "User not found");
    try {
        const faq = await Faq.find();
        if(faq) {
            return ApiResponse(res, 200, "Faq", faq);
        } else {
            return ApiResponse(res, 404, "Faq not found");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const getfaq = async (req, res) => {
    const faqId = req.params.faqId;
    if(!faqId) return ApiResponse(res, 400, "Please enter faqId");

    try {
        const faq = await Faq.findOne({ _id: faqId });
        if(faq) {
            return ApiResponse(res, 200, "Faq", faq);
        } else {
            return ApiResponse(res, 404, "Faq not found");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const add = async(req, res) => {
    const faqSchema = Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required()
    }).options({abortEarly: false});
    const { error, value } = faqSchema.validate(req.body);
    if(error) return ApiResponse(res, 401, "Validation failed", err);

    try {
        let faq = await Faq.findOne({ question: value.question });
        if(faq) return ApiResponse(res, 409, "This faq already exists", faq);

        faq = await Faq.create(value);
        if(faq) {
            return ApiResponse(res, 201, "Faq created");
        } else {
            return ApiResponse(res, 500, "Faq not created");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Something went wrong");
    }    
}

const edit = async (req, res) => {
    const faqSchema = Joi.object({
        _id: Joi.string().required(),
        question: Joi.string().required(),
        answer: Joi.string().required()
    }).options({abortEarly: false});
    const { error, value } = faqSchema.validate(req.body);
    if(error) return ApiResponse(res, 401, "Validation failed", err);

    try {
        const updatedFaq = await Faq.findOneAndUpdate(
            { _id: value._id },
            { $set: { question: value.question, answer: value.answer } },
            { new: true }
        );
        if(updatedFaq) {
            if(updatedFaq) {
                return ApiResponse(res, 200, "Faq edited");
            } else {
                return ApiResponse(res, 400, "Faq not edited");
            }
        } else {
            return ApiResponse(res, 404, "Faq not found");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Something went wrong");
    }  
}

const remove = async (req, res) => {
    const faqId = req.params.faqId;
    if(!faqId) return ApiResponse(res, 400, "Please enter faqId");

    try {
        let faq = await Faq.deleteOne({ _id: faqId });
        if(faq.acknowledged == true) {
            return ApiResponse(res, 201, "Faq deleted");
        } else {
            return ApiResponse(res, 500, "Faq not deleted");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Something went wrong");
    }    
}

const faq = {
    allfaqs,
    getfaq,
    add,
    edit,
    remove,
}

export default faq;