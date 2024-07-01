import Joi from "joi";

import User from "../../models/User.js";
import Disease from "../../models/Disease.js";
import DiseaseBasedQuestion from "../../models/DiseaseBasedQuestion.js";

import ApiResponse from "../../services/ApiResponse.js";
import calculateAge from "../../utils/calculateAge.js";
import DiseaseAnswer from "../../models/DiseaseAnswers.js";

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

const getAnsweredQuestions = async (req, res) => {
    if (!req.user._id)
        return ApiResponse(res, 401, "User unauthorised");
    try {
        const diseaseAnswers = await DiseaseAnswer.findOne({  userId: req.user._id});
        if (diseaseAnswers) {
            return ApiResponse(res, 200, "User answered disease answers", diseaseAnswers.diseaseAnswers);
        }
        return ApiResponse(res, 200, "User has not started the answering for diseases yet");
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

const answerDiseaseQuestions = async (req, res) => {
    const answersSchema = Joi.object({
        pcos: Joi.array().items(Joi.string()).optional(),
        diabetes: Joi.array().items(Joi.string()).optional(),
        hypothyroidism: Joi.array().items(Joi.string()).optional(),
        celiac: Joi.array().items(Joi.string()).optional(),
        ibd: Joi.array().items(Joi.string()).optional(),
        hyperthyroidism: Joi.array().items(Joi.string()).optional()
    }).options({abortEarly: false});
    const  { error, value } = answersSchema.validate(req.body);
    if (error)
        return ApiResponse(res, 400, "Validation Error", error);

    try {
        const filter = {
            userId: req.user._id
        }
        const update = {
            $set: {diseaseAnswers: Object.entries(value).map( ([key, val]) => ({ name: key, answer: val }))},
        }
        const options = {
            new: true,
            upsert: true
        }
        const answers = await DiseaseAnswer.findOneAndUpdate(filter, update, options);
        if(!answers) {
            return ApiResponse(res, 500, "Something went wrong");
        }
    } catch (error) {
        console.error(error);
        return ApiResponse(res, 500, "Validation Error");
    }
    let disease;
    let user;
    try {
        disease = await Disease.find();
    } catch (error) {
        console.error(error);
        return ApiResponse(res, 500, "Internal Server Error");
    }

    try {
        user = await User.findOne({ _id: req.user._id });
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server Error");
    }

    let totalPcos = disease.filter(disease => disease.name == "pcos")[0].diseaseQuestions.length;
    let totalDiabetes = disease.filter(disease => disease.name == "diabetes")[0].diseaseQuestions.length;
    let totalHypothyroidism = disease.filter(disease => disease.name == "hypothyroidism")[0].diseaseQuestions.length;
    let totalCeliac = disease.filter(disease => disease.name == "celiac")[0].diseaseQuestions.length;
    let totalIbd = disease.filter(disease => disease.name == "ibd")[0].diseaseQuestions.length;
    let totalHyperthyroidism = disease.filter(disease => disease.name == "hyperthyroidism")[0].diseaseQuestions.length;

    const pcos = calculateScore(value.pcos, totalPcos);
    const diabetes = calculateScore(value.diabetes, totalDiabetes);
    const hypothyroidism = calculateScore(value.hypothyroidism, totalHypothyroidism);
    const celiac = calculateScore(value.celiac, totalCeliac);
    const ibd = calculateScore(value.ibd, totalIbd);
    const hyperthyroidism = calculateScore(value.hyperthyroidism, totalHyperthyroidism);

    const age = calculateAge(user.dateofbirth);
    const weight = user.weight;

    const ageScore = ( age <= 30) ? 10 : (age > 50) ? 25 : 15;    
    const smokeScore = user.smoker;
    const drinkScore = user.drinker;
    const weightScore = (weight < 70) ? 0 : (weight >= 70 && weight <= 140 ) ? 7 : (weight > 140 && weight < 185) ? 15 : (weight >= 185 && weight < 211) ? 20 : (weight > 210) ? 25 : 0;

    let score = ageScore + smokeScore + drinkScore + weightScore;
    
    let diseaseAnswer = {
        pcos: (pcos) ? score + pcos : null,
        diabetes: (diabetes) ? score + diabetes : null,
        hypothyroidism: (hypothyroidism) ? `${score + hypothyroidism}% Secondary Hypothyroidism  and ${100 - (score + hypothyroidism)}% Primary Hypothyroidism` : null,
        celiac : (celiac) ? score + celiac : null,
        ibd: (ibd) ? score + ibd : null,
        hyperthyroidism: (hyperthyroidism) ? score + hyperthyroidism : null
    };

    return ApiResponse(res, 200, 'Test results', diseaseAnswer);
}

function calculateScore(conditionArray, totalCondition) {
    const length = conditionArray?.length ?? null;
    console.log(length);
    if (length == null) return null;
    const halfTotal = totalCondition / 2;

    if (length < halfTotal) return 10;
    if (length > halfTotal) return 25;
    if (length === halfTotal) return 15;
    return 0;
}

const disease = {
    getAllDiseases,
    getAnsweredQuestions,
    getDiseaseRelatedQuestions,
    answerDiseaseQuestions,
}

export default disease;