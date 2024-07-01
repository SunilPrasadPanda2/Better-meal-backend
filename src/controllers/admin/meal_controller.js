import Joi from "joi";

import Meal from "../../models/Meal.js";
import Tag from "../../models/Tag.js";
import MealPreferenceQuestion from "../../models/MealPreferenceQuestion.js";
import MealPreferenceSubQuestion from "../../models/MealPreferenceSubQuestion.js";

import ApiResponse from "../../services/ApiResponse.js";
import ApiTest from "../../services/ApiTest.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

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
}

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
}

const getAllMealQuestions = async (req, res) => {
  if(!req.user._id) 
    return ApiResponse(res, 401, "User not authenticated");
  try {
    const allMealPreferenceQuestions = await MealPreferenceQuestion.find();
    if(allMealPreferenceQuestions)
      return ApiResponse(res, 200, "All preference questions", allMealPreferenceQuestions);
    else
      return ApiResponse(res, 200, "No preference questions");
  } catch (err) {
    return ApiResponse(res, 500, "Internal Server Error");
  }
}

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
          option: Joi.string().required(), // meal IDs as strings
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
      return ApiResponse(res, 409, "This meal preference question already exists");
    }
    const lastQuestion = await MealPreferenceQuestion.findOne().sort({
      questionId: -1,
    });
    const nextQuestionId = lastQuestion ? lastQuestion.questionId + 1 : 1;

    const mealQuestions = {
      questionId: nextQuestionId,
      question: value.question.toLowerCase(),
      options: value.options
    };
    const mealPreference = await MealPreferenceQuestion.create(mealQuestions);
    if (mealPreference) {
      return ApiResponse(res, 201, "Meal preference question created", mealPreference);
    } else {
      return ApiResponse(res, 500, "Meal preference could not be created");
    }
  } catch (e) {
    return ApiResponse(res, 500, "Internal server error");
  }
}

const editMealPreferenceQuestion = async (req, res) => {
  const MealPreferenceSchema = Joi.object({
    _id: Joi.string().required(),
    question: Joi.string().required(),
    options: Joi.array()
      .items(
        Joi.object({
          option: Joi.string().required(),
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
}

const getAllConnectedSubQuestions = async (req, res) => {
  if(!req.params.questionId)
    return ApiResponse(res, 400, "Please select a question to get sub-questions");
  try {
    const subQuestion = await MealPreferenceSubQuestion.find({ questionLinkedTo: req.params.questionId })
    if (subQuestion){
      return ApiResponse(res, 200, "Meal preferences sub questions found", subQuestion);
    } else
      return ApiResponse(res, 404, "Meal preferences sub questions not found");
  } catch (err) {
    return ApiResponse(res, 500, "Internal Server Error");
  }
}

const getSingleConnectedSubQuestion = async (req, res) => {
  if(!req.params.questionId)
    return ApiResponse(res, 400, "Please select a question to get sub-questions");
  try {
    const subQuestion = await MealPreferenceSubQuestion.find({ _id: req.params.questionId })
    if (subQuestion){
      return ApiResponse(res, 200, "Meal preferences sub questions found", subQuestion);
    } else
      return ApiResponse(res, 404, "Meal preferences sub questions not found");
  } catch (err) {
    throw new Error(err);
    return ApiResponse(res, 500, "Internal Server Error");
  }
}

const addMealPreferenceSubQuestion = async (req,  res) => {
  const questionSchema = Joi.object({
    questionLinkedTo: Joi.string().required(),
    connectedOption: Joi.string().required(),
    question: Joi.string().required(),
    options: Joi.array()
      .items(
        Joi.object({
          option: Joi.string().required(),
        })
      )
      .required(),
  }).options({ abortEarly: false});
  const { error, value } = questionSchema.validate(req.body);
  if( error ) 
    return ApiResponse(res, 400, "Validation Failed", error);

  let question;
  let linkedQuestion;
  let subQuestion;
  let lastQuestion;
  try {
    linkedQuestion = await MealPreferenceQuestion.findOne({ question: value.questionLinkedTo });
    if(!linkedQuestion)
      return ApiResponse(res, 404, "Linked Question was not found");
    const optionExists = linkedQuestion.options.some(option => option.option === value.connectedOption);
    if (!optionExists) {
      return ApiResponse(res, 404, "Connected option was not found in linked question", linkedQuestion);
    }
    const selectedOption = linkedQuestion.options.find(option => option.option === value.connectedOption);
    value.connectedOption = selectedOption._id;
    
  } catch (err) {
    return ApiResponse(res, 500, "Internal Server Error");
  }
  try {
    question = await MealPreferenceSubQuestion.findOne({ question: value.question });
    if(question) 
      return ApiResponse(res, 409, "This question already exists", question);
  } catch (err) {
    return ApiResponse(res, 500, "Internal Server Error");
  }

  try {
    lastQuestion = await MealPreferenceSubQuestion.findOne().sort({
      questionId: -1,
    });
  } catch (err) {
    return ApiResponse(res, 500, "Internal Server Error");
  }

  const nextQuestionId = lastQuestion ? lastQuestion.questionId + 1 : 1;

  subQuestion = {
    questionLinkedTo: linkedQuestion._id,
    connectedOption: value.connectedOption,
    questionId: nextQuestionId,
    question: value.question,
    options: value.options
  }

  try {
    const createSubQuestion = await MealPreferenceSubQuestion.create(subQuestion);
    if( createSubQuestion ) 
      return ApiResponse(res, 200, "Meal sub-question created", createSubQuestion);
    else 
      return ApiResponse(res, 500, "Meal sub-question couldn't be created");
  } catch (e) {
    return ApiResponse(res, 500, "Internal Server Error");
  }
}

const editMealPreferenceSubQuestion = async (req, res) => {
  const MealPreferenceSchema = Joi.object({
    _id: Joi.string().required(),
    question: Joi.string().required(),
    options: Joi.array()
    .items(
      Joi.object({
        option: Joi.string().required(),
      })
    ).required(),
  }).options({ abortEarly: false })
  const { error, value } = MealPreferenceSchema.validate(req.body);
  if (error) 
    return ApiResponse(res, 400, "Validation failed", error);

  try {
    const subQuestion = await MealPreferenceSubQuestion.findOneAndUpdate(
      { _id: value._id },
      { question: value.question, options: value.options },
      { new: true}
    );
    if (subQuestion) {
      return ApiResponse(res, 200, "Sub question edited", subQuestion);
    } else {
      return ApiResponse(res, 404, "Sub question not found");
    }
  } catch (err) {
    return ApiResponse(res, 500, "Internal Server Error");
  }
}

const removeMeal = async (req, res) => {
  const MealSchema = Joi.object({
    _id: Joi.string().required(),
  }).options({ abortEarly: false });

  const { error, value } = MealSchema.validate(req.body);
  if (error) return ApiResponse(res, 400, "Validation failed", error);

  try {
    const meal = await Meal.findByIdAndDelete(value._id);
    if (meal) {
      return ApiResponse(res, 200, "Meal removed");
    } else {
      return ApiResponse(res, 404, "Meal not found");
    }
  } catch (err) {
    return ApiResponse(res, 500, "Internal Server Error", err);
  }
};

const removeMealPreferenceQuestion = async (req, res) => {
  const MealPreferenceQuestionSchema = Joi.object({
    _id: Joi.string().required(),
  }).options({ abortEarly: false });

  const { error, value } = MealPreferenceQuestionSchema.validate(req.body);
  if (error) return ApiResponse(res, 400, "Validation failed", error);

  try {
    const mealQuestion = await MealPreferenceQuestion.findByIdAndDelete(
      value._id
    );
    if (mealQuestion) {
      return ApiResponse(res, 200, "Question removed");
    } else {
      return ApiResponse(res, 404, "Question not found");
    }
  } catch (err) {
    return ApiResponse(res, 500, "Internal Server Error", err);
  }
};


const removeMealPreferenceSubQuestion = async (req, res) => {
  const MealPreferenceSchema = Joi.object({
    _id: Joi.string().required(),
  }).options({ abortEarly: false });

  const { error, value } = MealPreferenceSchema.validate(req.body);
  if (error)
    return ApiResponse(res, 400, "Validation failed", error);

  try {
    const subQuestion = await MealPreferenceSubQuestion.findByIdAndDelete(value._id);
    if (subQuestion) {
      return ApiResponse(res, 200, "Sub question removed");
    } else {
      return ApiResponse(res, 404, "Sub question not found");
    }
  } catch (err) {
    return ApiResponse(res, 500, "Internal Server Error", err);
  }
}

const meal = {
  allMeals,
  getMeal,
  addMeal,
  editMeal,
  getAllMealQuestions,
  getMealPreferenceQuestion,
  addMealPreferenceQuestion,
  editMealPreferenceQuestion,
  getAllConnectedSubQuestions,
  getSingleConnectedSubQuestion,
  addMealPreferenceSubQuestion,
  editMealPreferenceSubQuestion,
  removeMeal,
  removeMealPreferenceQuestion,
  removeMealPreferenceSubQuestion
};

export default meal;
