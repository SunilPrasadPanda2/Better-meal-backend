import Joi from "joi";
import User from "../../models/User.js";
import ApiResponse from "../../services/ApiResponse.js";

const allGutSurveyQuestions = async(req, res) => {
    if (!req.user._id) return ApiResponse(res, 403, "User not authenticated");
    try {
        const allQuestions = await GutSurveyQuestion.find();
        if(allQuestions.length> 0) 
            return ApiResponse(res, 200, "All gut survey questions", allQuestions);
        else if(allQuestions)
            return ApiResponse(res, 200, "Not gut survey questions added");
        else 
            return ApiResponse(res, 404, "Gut survey questions not found");
    } catch (e) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const addMedications = async (req, res) => {
    const medicationsSchema = Joi.object({
        medication: Joi.string().required()
    });
    const { error, value } = medicationsSchema.validate(req.body);

    if(error) 
        return ApiResponse(res, 400, "Validation failed", error);

    try {
        const user = await User.findOne({ _id: req.user._id});
        if(medication) {
            let existingMedication = user.medication;
            let newMedication = value.medication.split(',').map( medication => medication.trim());

        } else {
            return ApiResponse(res, 404, "User not found");
        }
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const gut = {
    allGutSurveyQuestions,
    addMedications,
}

export default gut;