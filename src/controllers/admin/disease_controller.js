import Disease from "../../models/Disease.js";

import ApiResponse from "../../services/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

const addDisease = async (req, res) => {
    try {
        if(!req.file){
            return ApiResponse(res, 400, "Disease pic not found");
        }
        const diseaseImage = await uploadOnCloudinary(req.file.path);
        const diseaseModel = {
            name: req.body.name,
            image: diseaseImage.url,
            diseaseQuestions: []
        }
        const disease = await Disease.create(diseaseModel);
        if (disease) 
            return ApiResponse(res, 200, "disease added successfully");
        else 
            return ApiResponse(res, 500, "something went wrong");
    } catch (error) {
        console.error(error);
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const addDiseaseQuestions = async (req, res) => {
    try {
        const filter = {
            name: req.body.name
        }
        const update = {
            $push: { diseaseQuestions: req.body.questions } 
        }
        const options = {
            new: true
        }
        const diseaseUpdate = await Disease.findOneAndUpdate(filter, update, options);
        if (diseaseUpdate) 
            return ApiResponse(res, 200, "Disease questions updated", diseaseUpdate);
        else 
            return ApiResponse(res, 500, "Questions could not be updated");
    } catch (error) {
        console.error(error);
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const disease = {
    addDisease,
    addDiseaseQuestions,
}

export default disease;