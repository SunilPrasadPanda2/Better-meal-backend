import Joi from "joi";
import ExploreMeal from "../../models/ExploreMeal.js";
import Tag from "../../models/Tag.js";

import ApiResponse from "../../services/ApiResponse.js";

const getSingleExploreSection = async(req, res) => {
    if(!req.params.id) return ApiResponse(res, 400, "Please provide the explore-section id");
    try {
        const exploreMeal = await ExploreMeal.findById(req.params.id).populate('tags');
        if (!exploreMeal) {
            return res.status(404).json({ message: 'ExploreMeal section not found' });
        }
        return ApiResponse(res, 200, "Explore Section", exploreMeal);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

const getAllExploreSection = async(req, res) => {
    try {
        const exploreMeal = await ExploreMeal.find().populate('tags');
        if (!exploreMeal) {
            return res.status(404).json({ message: 'ExploreMeal section not found' });
        }
        return ApiResponse(res, 200, "Explore Section", exploreMeal);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

const addForExploreSection = async (req, res) => {
    const exploreSectionSchema = Joi.object({
        name: Joi.string().required(),
        advice: Joi.string().required(),
        tags: Joi.string().required(),
        description: Joi.string().required(),
        date: Joi.string().optional()
    }).options({abortEarly: true});
    const { error, value } = exploreSectionSchema.validate(req.body);
    if (error) 
        return ApiResponse(res, 400, "Validation error", error);

    if (!req.file) {
        return ApiResponse(res, 400, "Profile picture file is required");
    }
    const image = await uploadOnCloudinary(req.file.path);
    const tagsArray = await Promise.all(value.tags.split(',').map(async(tag) => {
        let newTag = await Tag.findOne({ tagName: tag });
        if (newTag) return newTag;
        else return null;
    }));
    const filteredTagsArray = tagsArray.filter(tag => tag !== null);

    try {
        const exploreSectionExists = await ExploreMeal.findOne({ name: value.name });
        if (exploreSectionExists) return ApiResponse(res, 409, "This Item already exists");
        try {
            const explore = {
                name: value.name,
                advice: value.advice,
                tags: filteredTagsArray,
                description: value.description,
                date: value.date?? null,
                image: image.url
            }
            const exploreSection = await ExploreMeal.create(explore);
            if (exploreSection) return ApiResponse(res, 201, "created", exploreSection);
            else return ApiResponse(res, 400, "Item not created");
        } catch (err) {
            console.log(err);
            return ApiResponse(res, 500, "Internal Server Error");
        }
    } catch (err) {
        console.log(err);
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const editExploreSection = async (req, res) => {
    const exploreSectionSchema = Joi.object({
        _id: Joi.string().required(),
        name: Joi.string().required(),
        advice: Joi.string().required(),
        tags: Joi.string().required(),
        description: Joi.string().required(),
        date: Joi.string().optional()
    }).options({abortEarly: false});
    const { error, value } = exploreSectionSchema.validate(req.body);
    if (error) 
        return ApiResponse(res, 400, "Validation error", error);

    let image;
    if (req.file) {
        image = await uploadOnCloudinary(req.file.path);
    }

    const tagsArray = await Promise.all(value.tags.split(',').map(async(tag) => {
        let newTag = await Tag.findOne({ tagName: tag });
        if (newTag) return newTag;
        else return null;
    }));
    const filteredTagsArray = tagsArray.filter(tag => tag !== null);

    try {
        const exploreSectionExists = await ExploreMeal.findById(exploreSectionId);
        if (!exploreSectionExists) return ApiResponse(res, 404, "Item not found");

        const updatedData = {
            name: value.name,
            advice: value.advice,
            tags: filteredTagsArray,
            description: value.description,
            image: image?.url ?? exploreSectionExists.image,
            date: value.date ?? null
        };

        try {
            const updatedExploreSection = await ExploreMeal.findByIdAndUpdate(
                exploreSectionId, 
                updatedData, 
                { new: true }
            );
            if (updatedExploreSection) 
                return ApiResponse(res, 200, "updated", updatedExploreSection);
            else 
                return ApiResponse(res, 400, "Item not updated");
        } catch (err) {
            console.log(err);
            return ApiResponse(res, 500, "Internal Server Error");
        }
    } catch (err) {
        console.log(err);
        return ApiResponse(res, 500, "Internal Server Error");
    }
}


const exploreSection = {
    getSingleExploreSection,
    getAllExploreSection,
    addForExploreSection,
    editExploreSection,
}

export default exploreSection;