import Meal from "../../models/Meal.js";
import Tag from "../../models/Tag.js";
import MealPreferenceQuestion from "../../models/MealPreferenceQuestion.js";

import ApiResponse from "../../services/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import Joi from "joi";

const allMeals = async (req, res) => {
  if(!req.user._id) return ApiResponse(res, 404, "User not found");
  try {
    const meals = await Meal.find().populate("tags");
    if( meals ) {
      return ApiResponse(res, 200, "Meal", meals);
    } else {
      return ApiResponse(res, 200, "No are added.");
    }
  } catch( err ) {
    return ApiResponse(res, 500, "Internal Server Error", err.message);
  }
}

const getMeal = async (req, res) => {
  const _id = req.params._id;
  if(!_id) return ApiResponse(res, 400, "Please provide id for the question");

  try { 
    const meal = await Meal.findOne({_id: _id});
    if(meal) {
      await meal.populate('tags')
      return ApiResponse(res, 200, "Meal", meal);
    } else {
      return ApiResponse(res, 404, "Meal not found");
    }
  } catch(err) {
    return ApiResponse(res, 500, "Internal Server Error");
  }
}

const addMeal = async (req, res) => {
  const MealSchema = Joi.object({
    mealName: Joi.string().required(),
    calories: Joi.string().required(),
    description: Joi.string().required(),
    nutrientsInfo: Joi.string().required(),
    mealTiming: Joi.string().required(),
    tags: Joi.string().required(),
    rating: Joi.string().optional(),
    quantity: Joi.string().optional(),
  });
  const { error, value } = MealSchema.validate(req.body);

  if (error) {
    const errordetail = error.details.map((detail) => detail.message);
    return ApiResponse(res, 400, "Validation failed", errordetail);
  }

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Profile picture file is required" });
    }
    const mealImage = await uploadOnCloudinary(req.file.path);

    const tagsArray = value.tags.split(",").map((tag) => tag.trim());
    const tagIds = await Promise.all(
      tagsArray.map(async (tag) => {
        let tagExist = await Tag.findOne({ tagName: tag });
        if (tagExist) {
          return tagExist._id;
        } else {
          let tagCreate = await Tag.create({ tagName: tag });
          return tagCreate._id;
        }
      })
    );
    const mealTimingArray = value.mealTiming
      .split(",")
      .map((mealTime) => mealTime.trim());
    const mealExists = await Meal.findOne({ mealName: value.mealName });
    if (mealExists) return ApiResponse(res, 409, "Meal already exists");
    const mealData = {
      mealName: value.mealName,
      calories: value.calories,
      description: value.description,
      nutrientsInfo: value.nutrientsInfo,
      mealTiming: mealTimingArray,
      tags: tagIds,
      rating: req.body.rating,
      image: mealImage.url,
      quantity: req.body.quantity
    };
    const meal = await Meal.create(mealData);
    if (meal) {
      await meal.populate('tags');
      return ApiResponse(res, 201, "Meal created successfully", meal);
    } else {
      return ApiResponse(res, 500, "Something went wrong");
    }
  } catch (err) {
    return ApiResponse(res, 500, "Something went wrong", err.message);
  }
};

const editMeal = async (req, res) => {
  const MealSchema = Joi.object({
    _id: Joi.string().required(),
    mealName: Joi.string().required(),
    calories: Joi.string().required(),
    description: Joi.string().required(),
    nutrientsInfo: Joi.string().required(),
    tags: Joi.string().required(),
    rating: Joi.string().optional(),
    quantity: Joi.string().required(),
    mealTiming: Joi.string().required(),
  }).options({ abortEarly: false });
  const { error, value } = MealSchema.validate(req.body);

  if (error) {
    const errordetail = error.details.map((detail) => detail.message);
    return ApiResponse(res, 400, "Validation failed", errordetail);
  }

  try {
    const tagsArray = value.tags.split(",").map((tag) => tag.trim());
    const tagIds = await Promise.all(
      tagsArray.map(async (tag) => {
        let tagExist = await Tag.findOne({ tagName: tag });
        if (tagExist) {
          return tagExist._id;
        } else {
          let tagCreate = await Tag.create({ tagName: tag });
          return tagCreate._id;
        }
      })
    );
    const mealTimingArray = value.mealTiming
      .split(",")
      .map((mealTime) => mealTime.trim());
    const mealExists = await Meal.findOne({ _id: value._id });
    if (mealExists) {
      let mealImage;
      if (req.file) {
        mealImage = await uploadOnCloudinary(req.file.path);
      } else {
        mealImage = mealExists.image;
      }
      const mealData = {
        mealName: value.mealName,
        calories: value.calories,
        description: value.description,
        nutrientsInfo: value.nutrientsInfo,
        mealTiming: mealTimingArray,
        tags: tagIds,
        rating: req.body.rating,
        image: mealImage.url,
        quantity: req.body.quantity
      };
      const mealUpdate = await Meal.updateOne(
        { _id: mealExists._id },
        { $set: mealData }
      );

      if (mealUpdate.modifiedCount > 0) {
        return ApiResponse(res, 200, "Meal modified");
      } else {
        return ApiResponse(res, 500, "Failed to update meal");
      }
    } else {
      return ApiResponse(res, 404, "Meal not found");
    }
  } catch (err) {
    return ApiResponse(res, 500, "Internal server error", err.message);
  }
};

const getMealPreferenceQuestion = async (req, res) => {
  const questionId = req.params.questionId;
  if(!questionId) return ApiResponse(res, 400, "questionId not provided");

  try {
    const question = await MealPreferenceQuestion.findOne({ _id: questionId });
    if(question) {
      return ApiResponse(res, 200, "Meal preference question found", question);
    } else {
      return ApiResponse(res, 404, "Meal preference question not found");
    }
  } catch (err) {
    return ApiResponse(res, 500, "Internal server error");
  }
}

const addMealPreferenceQuestion = async (req, res) => {
  const MealPreferenceSchema = Joi.object({
    question: Joi.string().required(),
    options: Joi.array()
      .items(
        Joi.object({
          option: Joi.string().required(),
          mealIds: Joi.array().items(Joi.string().optional()).required(), // meal IDs as strings
        })
      )
      .required(),
  }).options({ abortEarly: false });
  const { error, value } = MealPreferenceSchema.validate(req.body);
  if (error) {
    const err = error.details.map((detail) => detail.message);
    return ApiResponse(res, 400, "Validation failed", { error: err });
  }

  try {
    const mealPreferenceExists = await MealPreferenceQuestion.findOne({
      question: value.question.toLowerCase(),
    });
    if (mealPreferenceExists) {
      return ApiResponse(
        res,
        409,
        "This meal preference question already exists"
      );
    }
    const lastQuestion = await MealPreferenceQuestion.findOne().sort({
      questionId: -1,
    });
    const nextQuestionId = lastQuestion ? lastQuestion.questionId + 1 : 1;
    const mealQuestions = {
      questionId: nextQuestionId,
      question: value.question.toLowerCase(),
      options: value.options,
    };
    const mealPreference = await MealPreferenceQuestion.create(mealQuestions);
    if (mealPreference) {
      return ApiResponse(res, 201, "Meal preference question created");
    } else {
      return ApiResponse(res, 500, "Meal preference could not be created");
    }
  } catch (e) {
    return ApiResponse(res, 500, "Internal server error: " + e.message);
  }
};

const editMealPreferenceQuestion = async (req, res) => {
  const MealPreferenceSchema = Joi.object({
    _id: Joi.string().required(),
    question: Joi.string().required(),
    options: Joi.array()
      .items(
        Joi.object({
          option: Joi.string().required(),
          mealIds: Joi.array().items(Joi.string().optional()).optional(),
        })
      )
      .required(),
  }).options({ abortEarly: false });
  const { error, value } = MealPreferenceSchema.validate(req.body);
  if (error) {
    const err = error.details.map((detail) => detail.message);
    return ApiResponse(res, 400, "Validation failed", { error: err });
  }

  try {
    const mealPreferenceExists = await MealPreferenceQuestion.findOne({
      _id: value._id,
    });
    if (mealPreferenceExists) {
      const mealQuestions = {
        questionId: mealPreferenceExists.questionId,
        question: value.question.toLowerCase(),
        options: value.options,
      };
      const mealPreference = await MealPreferenceQuestion.updateOne(
        { _id: value._id },
        { $set: mealQuestions }
      );
      if (mealPreference.modifiedCount > 0) {
        return ApiResponse(res, 200, "Meal updated successfully");
      } else {
        return ApiResponse(res, 400, "Meal could not be modified");
      }
    } else {
      return ApiResponse(
        res,
        404,
        "This meal could not be found. Please refresh the page"
      );
    }
  } catch (e) {
    return ApiResponse(res, 500, "Internal server error: " + e.message);
  }
};

const meal = {
  allMeals,
  getMeal,
  addMeal,
  editMeal,
  getMealPreferenceQuestion,
  addMealPreferenceQuestion,
  editMealPreferenceQuestion,
};

export default meal;
