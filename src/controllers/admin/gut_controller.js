import Joi from 'joi';
import GutSurveyQuestion from '../../models/GutSurveyQuestion.js';
import ApiResponse from '../../services/ApiResponse.js';

const allGutSurveyQuestions = async(req, res) => {
    if (!req.user._id) return ApiResponse(res, 403, "User not authenticated");
    try {
        const allQuestions = await GutSurveyQuestion.find();
        if(allQuestions.length> 0) 
            return ApiResponse(res, 200, "All gut survey questions1", allQuestions);
        else if(allQuestions)
            return ApiResponse(res, 200, "Not gut survey questions added");
        else 
            return ApiResponse(res, 404, "Gut survey questions not found");
    } catch (e) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const getSingleGutSurveyQuestion = async (req, res) => {
    if(!req.user._id) return ApiResponse(res, 403, "User not authorised");
    if(!req.params.questionId) return ApiResponse(res, 400, "Question ID not provided");
    try {
        const question = await GutSurveyQuestion.findOne({ _id: req.params.questionId });
        if (question)
            return ApiResponse(res, 200, "Question found", question);
        else 
            return ApiResponse(res, 404, "Question not found");
    } catch (e) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const addSurveyQuestions = async(req, res) => {
    const questionSchema = Joi.object({
        question: Joi.string().required(),
        gender: Joi.string()
    });
    const { error, value } = questionSchema.validate(req.body);
    if(error) return ApiResponse(res, 400, "Validation failed", error);
    try {
        let gutQuestion = await GutSurveyQuestion.findOne({question: value.question});
        if( gutQuestion) return ApiResponse(res, 400, "This question already exists");
        else {
            try {
                gutQuestion = await GutSurveyQuestion.create(value);
                if( gutQuestion) {
                    return ApiResponse(res, 201, "Question created", gutQuestion);
                } else {
                    return ApiResponse(res, 400, "Question not created");
                }
            } catch (e) {
                return ApiResponse(res, 400, "Internal Server Error");
            }
        }
    } catch (e) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
    
}

const editSurveyQuestion = async (req, res) => {
    if(!req.user._id) return ApiResponse(res, 403, "User not authorised");
    const editSchema = Joi.object({
        _id: Joi.string().required(),
        question: Joi.string().required(),
        gender: Joi.string().required()
    }).options({abortEarly: false});
    const { error, value } = editSchema.validate(req.body);
    if(error) return ApiResponse(res, 400, "Validation failed", error);
    try {
        const updatedGutQuestion = await GutSurveyQuestion.findByIdAndUpdate(
            req.body._id,
            value,
            {new: true}
        );
        if( updatedGutQuestion)
            return ApiResponse(res, 200, "Survey question edited successfully");
        else 
            return ApiResponse(res, 400, "Survey question not edited");
    } catch (e) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const gut = {
    allGutSurveyQuestions,
    getSingleGutSurveyQuestion,
    addSurveyQuestions,
    editSurveyQuestion
}

export default gut;