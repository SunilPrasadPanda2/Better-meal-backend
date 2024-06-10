import Joi from "joi";

import Disease from "../../models/Disease.js";
import DiseaseBasedQuestion from "../../models/DiseaseBasedQuestion.js";

import ApiResponse from "../../services/ApiResponse.js";

const getAllDiseases = async(req, res) => {
    if(!req.user._id) 
        return ApiResponse(res, 403, "User not authorised");

    try {
        const diseases = await Disease.find();
        if(diseases.length > 0)  
            return ApiResponse(res, 200, "All diseases found", diseases);
        else if (diseases) 
            return ApiResponse(res, 404, "No diseases present");
        else 
            return ApiResponse(res, 404, "Diseases not found");
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
} 

const getDiseaseRelatedQuestions = async (req, res) => {
    if(!req.user._id) 
        return ApiResponse(res, 403, "User not authorised");
    if(!req.params.diseaseId) 
        return ApiResponse(res, 400, "Disease not selected");

    try {
        const diseasesQuestions = await DiseaseBasedQuestion.find({ diseaseId: req.params.diseaseId });
        if (diseasesQuestions) 
            return ApiResponse(res, 200, "Diesase related questions found", diseasesQuestions);
        else 
            return ApiResponse(res, 404, "Disease not found");
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const userDiseaseAnswer = async (req, res) => {
    
}

const disease = {
    getAllDiseases,
    getDiseaseRelatedQuestions,
    userDiseaseAnswer,
}