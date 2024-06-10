import Joi from "joi";

import UserAddedMeal from "../../models/UserAddedMeal.js";
import Tag from "../../models/Tag.js";
import Meal from "../../models/Meal.js";
import MealPreferenceQuestion from "../../models/MealPreferenceQuestion.js";
import UserFavouriteMeal from "../../models/UserFavouriteMeal.js"

import ApiResponse from "../../services/ApiResponse.js";
import UserMealPreference from "../../models/UserMealPreference.js";
import WeeklyMealRecommendation from "../../models/WeeklyMealRecommendation.js";

const MealQuestions = async(req, res) => {
    try {
        const mealQuestions = await MealPreferenceQuestion.find({},{
            'question':1,
            'options.option': 1
        });
        return ApiResponse(res, 200, "Meal Questions", mealQuestions);
    } catch (err) {
        return ApiResponse(res, 500, "Internal Server Error", err);
    }
}

const addUserMealPreferences = async(req, res) => {
    const MealPreferenceSchema = Joi.object({
        questionId: Joi.string().required(),
        options: Joi.string().optional()
    }).options({abortEarly: false});

    const validations = req.body.map(entry => MealPreferenceSchema.validate(entry));
    const errors = validations.filter(v => v.error);
    if (errors.length > 0) {
        return ApiResponse(res, 400, "Validation failed", errors.map(e => e.error.details));
    }
    const values = validations.map(v => v.value);
     
    try {
        const valueSelected = await Promise.all(values.map(async (v) => {
            const optionsArray = v.options.split(',').map(option => option.trim());
            const question = await MealPreferenceQuestion.findOne({ _id: v.questionId });

            const mealIds = [];
            if (question && question.options) {
                question.options.forEach(option => {
                    if (optionsArray.includes(option.option)) {
                        mealIds.push(...option.mealIds.map(id => id.toString()));
                    }
                });
            }

            return {
                questionId: v.questionId,
                options: optionsArray,
                recommendations: mealIds
            };
        }));

        const userRecommendations = valueSelected.map( value => value.recommendations ).flat();
        const MealPreference = {
            userId: req.user._id,
            valueSelected,
            userRecommendations: userRecommendations
        };

        const MealPreferences = await UserMealPreference.create(MealPreference);
        if(MealPreferences) {
            const weeklyMealRecommend = addWeeklyMealRecommendations(req.user._id).then(data => date).catch(err => err);
            // console.log(weeklyMealRecommend);
            return ApiResponse(res, 201, "Meal preferences added", MealPreferences);
        }
        return ApiResponse(res, 200, "Meal preferences processed successfully", MealPreference);
    } catch (error) {
        return ApiResponse(res, 500, "Server error", error);
    }
}

const addWeeklyMealRecommendations = async (userId) => {
    try {
        const dateObj = new Date();
        const day = dateObj.getDay();
        const diff = dateObj.getDate() - day;
        dateObj.setDate(diff);
        const weekStartDate = dateConvo(dateObj);

        const mealRecommendations = await WeeklyMealRecommendation.findOne({ 
            userId: userId,
            weekStartDate: weekStartDate
        });

        const dates = new Date(weekStartDate);
        const datesArray = [];
        
        for (let i = 0; i < 7; i++) {
          datesArray.push(dateConvo(dates)); // Create a new Date object for each day
          dates.setDate(dates.getDate() + 1); // Increment date for the next iteration
        }
        let recommendations = await Promise.all(datesArray.map( async(date) => {
            return {
                date: date,
                meals : {
                    breakfast: [await Meal.findOne({ mealTiming: { $in: ["breakfast"] } })],
                    lunch: [await Meal.findOne({ mealTiming: { $in: ["lunch"] } })],
                    dinner: [await Meal.findOne({ mealTiming: { $in: ["dinner"] } })]
                }
            }
        }));
        const weeklyMeals = {
            userId: userId,
            weekStartDate: weekStartDate,
            recommendations: recommendations
        };
        if(mealRecommendations) {
            const updatedMealRecommendations = await WeeklyMealRecommendation.updateOne(
                { userId: userId },
                { recommendations: recommendations },
                { new: true }
            );
            if(updatedMealRecommendations.modifiedCount > 0) {
                return ApiResponse(res, 200, "Meal recommendations for this week updated");
            } else {
                return ApiResponse(res, 400, "Meal recommendations for this week not updated");
            }
        } else {
            console.log("create");
            console.log(weeklyMeals);
            const createdMealRecommendations = await WeeklyMealRecommendation.create(weeklyMeals);
            if (createdMealRecommendations) {
                return ["Meal recommendation for this week created", createdMealRecommendations];
            } else {
                return "Weekly meal recommendation not created";
            }   
        }
    } catch (err) {
        console.log(err);
        return "Internal Server error" + err;
    }
}

const dateConvo = (dateObj) => {
    if(!(dateObj instanceof Date)) {
        throw new TypeError('Input must be a Date object');
    }
    return `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}-${dateObj.getFullYear()}`;
}

const editUserMealPreferences = async(req, res) => {
    const MealPreferenceSchema = Joi.object({
        questionId: Joi.string().required(),
        options: Joi.string().optional()
    }).options({abortEarly: false});

    const validations = req.body.map(entry => MealPreferenceSchema.validate(entry));
    const errors = validations.filter(v => v.error);
    if (errors.length > 0) {
        return ApiResponse(res, 400, "Validation failed", errors.map(e => e.error.details));
    }
    const values = validations.map(v => v.value);
     
    try {
        const valueSelected = await Promise.all(values.map(async (v) => {
            const optionsArray = v.options.split(',').map(option => option.trim());
            const question = await MealPreferenceQuestion.findOne({ _id: v.questionId });

            const mealIds = [];
            if (question && question.options) {
                question.options.forEach(option => {
                    if (optionsArray.includes(option.option)) {
                        mealIds.push(...option.mealIds.map(id => id.toString()));
                    }
                });
            }

            return {
                questionId: v.questionId,
                options: optionsArray,
                recommendations: mealIds.join(',')
            };
        }));

        const MealPreferences = await UserMealPreference.findOne({ userId: req.user._id});
        if(MealPreferences) {
            const updatedMealPreference = await UserMealPreference.updateOne(
                { userId: req.user._id },
                { $set: MealPreferences },
                { new: true }
            );
            if(updatedMealPreference.modifiedCount > 0) {
                return ApiResponse(res, 201, "Meal preferences added", updatedMealPreference);
            } else {
                return ApiResponse( res, 400, "Meal preference couldn't be added")
            }
        }
        return ApiResponse(res, 200, "No meal preference for this user found");
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server error", error);
    }
}

const getUserMealPreferences = async (req, res) => {
    if(!req.user._id) return ApiResponse(res, 404, "User not found please login again");
    try {
        const userMealRecommendation = await UserMealPreference.findOne({ userId: req.user._id }).populate({ path: 'valueSelected.questionId', select: '-options.mealIds' });
        if(userMealRecommendation) {
            return ApiResponse(res, 200, "Your meal preferences", userMealRecommendation);
        } else {
            return ApiResponse(res, 200, "No meal preferences added yet");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const addMeal = async(req, res) => {
    const MealSchema = Joi.object({
        mealName: Joi.string().required(),
        calories: Joi.string().required(),
        description: Joi.string().required(),
        nutrientsInfo: Joi.string().required(),
        tags: Joi.string().required(),
        rating: Joi.string().optional()
    });
    const { error, value } = MealSchema.validate(req.body);

    if(error) {
        const errordetail = error.details.map(detail => detail.message);
        return ApiResponse(res, 400, "Validation failed", errordetail); 
    }

    try {
        if (!req.file) {
            return res.status(400).json({ message: "Profile picture file is required" });
        }
        const mealImage = await uploadOnCloudinary(req.file.path);

        const tagsArray = value.tags.split(',').map(tag => tag.trim());
        const tagIds = await Promise.all(tagsArray.map(async (tag) => {
            let tagExist = await Tag.findOne({ tagName: tag });
            if (tagExist) {
                return tagExist._id;
            } else {
                let tagCreate = await Tag.create({ tagName: tag });
                return tagCreate._id;
            }
        }));
        const mealExists = await UserAddedMeal.findOne({mealName: value.mealName});
        if(mealExists) return ApiResponse(res, 409, "Meal already exists");
        const mealData = {
            mealName: value.mealName,
            calories: value.calories,
            description: value.description,
            nutrientsInfo: value.nutrientsInfo,
            tags: tagIds,
            rating: req.body.rating,
            mealImage: mealImage.url
        };
        const meal = await UserAddedMeal.create(mealData);
        if(meal) {
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
        mealName: Joi.string().required(),
        calories: Joi.string().required(),
        description: Joi.string().required(),
        nutrientsInfo: Joi.string().required(),
        tags: Joi.string().required(),
        rating: Joi.string().optional()
    }).options({abortEarly: false});
    const { error, value } = MealSchema.validate(req.body);

    if(error) {
        const errordetail = error.details.map(detail => detail.message);
        return ApiResponse(res, 400, "Validation failed", errordetail); 
    }

    try {
        const tagsArray = value.tags.split(',').map(tag => tag.trim());
        const tagIds = await Promise.all(tagsArray.map(async (tag) => {
            let tagExist = await Tag.findOne({ tagName: tag });
            if (tagExist) {
                return tagExist._id;
            } else {
                let tagCreate = await Tag.create({ tagName: tag });
                return tagCreate._id;
            }
        }));
        const mealExists = await UserAddedMeal.findOne({mealName: value.mealName});
        if(mealExists && mealExists._id == req.value._id){
            let mealImage;
            if (req.file) {
                mealImage = await uploadOnCloudinary(req.file.path);
            } else {
                mealImage = mealExists.image;
            }
            const mealData = {
                userInfo: req.user._id,
                mealName: value.mealName,
                calories: value.calories,
                description: value.description,
                nutrientsInfo: value.nutrientsInfo,
                tags: tagIds,
                rating: req.body.rating,
                mealImage: mealImage.url
            };
            const mealUpdate = await UserAddedMeal.updateOne(
                { _id: mealExists._id },
                { $set: mealData }
            );

            if( mealUpdate.modifiedCount > 0 ) {
                return ApiResponse(res, 200, "Meal modified", );
            } else {
                return ApiResponse(res, 500, "Something went wrong");
            }
        } else {
            return ApiResponse(res, 500, "Meal not found");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Something went wrong", err.message);
    }
}

const getMeals = async (req, res) => {
    if(!req.user._id) return ApiResponse(res, 404, "User not found");
    try {
      const meals = await Meal.find().populate('tags');
        // Fetching user's favorite meals
        const userFavs = await UserFavouriteMeal.findOne({ userId: req.user._id });
        const favMealIds = userFavs ? userFavs.mealIds.map(id => id.toString()) : [];

        // Mark meals as favorited by the user
        const mealsWithFavs = meals.map(meal => ({
            ...meal.toObject(),
            isFavorited: favMealIds.includes(meal._id.toString())
        }));
      
      if( meals ) {
        return ApiResponse(res, 200, "Meals", mealsWithFavs);
      } else {
        return ApiResponse(res, 200, "No are added.");
      }
    } catch( err ) {
      return ApiResponse(res, 500, "Internal Server Error", err.message);
    }
}

const mealRecommendations = async (req, res) => {
    const mealRecommendationsSchema = Joi.object({
        date: Joi.date().required()
    }).options({abortEarly: false});
    const { error, value } = mealRecommendationsSchema.validate(req.body);
    if(error) return ApiResponse(res, 400, "Validation failed", error.message);

    const dateObj = new Date();
    const day = dateObj.getDay();
    const diff = dateObj.getDate() - day;
    dateObj.setDate(diff);
    const weekStartDate = dateConvo(dateObj);

    try {
        const mealRecommendations = await WeeklyMealRecommendation.findOne({
            userId: req.user._id, 
            weekStartDate: weekStartDate});
        if(mealRecommendations) {
            return ApiResponse(res, 200, "Your meal recommendations", mealRecommendations);
        } else {
            return ApiResponse(res, 400, "No recommendations found");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Internal Server Error", err);
    }
}

const meal = {
    MealQuestions,
    addUserMealPreferences,
    editUserMealPreferences,
    getUserMealPreferences,
    addMeal,
    editMeal,
    getMeals,
    addWeeklyMealRecommendations,
    mealRecommendations,
}

export default meal;