import Joi from "joi";
import mongoose from 'mongoose';


import Tag from "../../models/Tag.js";
import Meal from "../../models/Meal.js";
import User from "../../models/User.js";
import UserAddedMeal from "../../models/UserAddedMeal.js";
import UserFavouriteMeal from "../../models/UserFavouriteMeal.js"
import MealPreferenceQuestion from "../../models/MealPreferenceQuestion.js";
import MealPreferenceSubQuestion from "../../models/MealPreferenceSubQuestion.js";
import UserMealPreference from "../../models/UserMealPreference.js";
import WeeklyMealRecommendation from "../../models/WeeklyMealRecommendation.js";

import formatDate from "../../utils/formatDate.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import ApiResponse from "../../services/ApiResponse.js";
import ApiTest from "../../services/ApiTest.js";
import UserWeeklyMealSelection from "../../models/UserWeeklyMealSelection.js";

const getMealQuestions = async(req, res) => {
    if(!req.user._id)
        return ApiResponse(res, 401, "User not authenticated");
    try {
        const mealPreferenceFilled = await UserMealPreference.findOne({ userId: req.user._id });
        if (mealPreferenceFilled) {
            const questionsAnswered = mealPreferenceFilled.valueSelected.map(value => value.questionId);
            const questionIdsArray = await Promise.all(
                questionsAnswered.map( async(question) => {
                    const questionNumber = await MealPreferenceQuestion.findOne(
                        { _id: question._id },
                        { questionId: 1}
                    );
                    if( questionNumber && questionNumber.questionId )
                        return questionNumber.questionId;
                    else 
                        return null;
                })
            );
            const sortedQuestionIdsArray = questionIdsArray.sort((x,y) => y-x);
            const lastQuestion = sortedQuestionIdsArray[0];
            try {
                const queryForSubQuestion = await MealPreferenceQuestion.findOne({ questionId: lastQuestion });
                const array = queryForSubQuestion.options.filter( option => {
                    return mealPreferenceFilled.valueSelected[mealPreferenceFilled.valueSelected.length -1].options.includes(option.option)
                });
                const subQuestionExist = await MealPreferenceSubQuestion.find({ questionLinkedTo:  queryForSubQuestion, connectedOption: { $in : array.map(opt => opt._id) } });
                if (subQuestionExist.length > 0) {
                    const subQuestionsArray = subQuestionExist.map( sub => sub.questionId ).sort((x,y) => x-y);
                    const subQuestionsId = mealPreferenceFilled.valueSelected[mealPreferenceFilled.valueSelected.length - 1];
                    if(subQuestionsId.subQuestionExist == true) {
                        const firstKey = Object.keys(subQuestionExist)[0];
                        return ApiResponse(res, 200, "User Meal Survey Sub Question",subQuestionExist[firstKey]);
                    } else {
                        const answeredSubQuestions = mealPreferenceFilled.valueSelected[mealPreferenceFilled.valueSelected.length - 1].subQuestionExist.map(sub => sub.questionId);
                        const nextSubQuestionId = subQuestionsArray.find(element => !answeredSubQuestions.includes(element));
                        if(nextSubQuestionId) {
                            const nextSubQuesiton = subQuestionExist.filter( obj => obj.questionId == nextSubQuestionId);
                            return ApiResponse(res, 200, "User Meal Survey Sub Question", nextSubQuesiton);
                        }
                    }
                }   
            } catch (err) {
                return ApiResponse(res, 500, "Internal Server Error");
            }
            try {
                const nextMealQuestion = await MealPreferenceQuestion.findOne({ questionId: (lastQuestion+1) });
                if(nextMealQuestion) 
                    return ApiResponse(res, 200, "User Meal Survey Question", nextMealQuestion);
                else 
                    addWeeklyMealRecommendations(req.user._id);
                    return ApiResponse(res, 200, "You have completed the survey");
            } catch (err) {
                return ApiResponse(res, 500, "Internal Server Error");
            }
        } else {
            const mealQuestion = await MealPreferenceQuestion.findOne({ questionId: 1 });
            return ApiResponse(res, 200, "Meal Questions", mealQuestion);
        }
    } catch (err) {
        throw new Error(err, 'msg2');
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const addUserMealPreferences = async(req, res) => {
    const MealPreferenceSchema = Joi.object({
        questionId: Joi.string().required(),
        options: Joi.string().optional(),
        connectedOption: Joi.string().optional()
    }).options({abortEarly: false});
    const { error, value } = MealPreferenceSchema.validate(req.body);

    if (error) {
        return ApiResponse(res, 400, "Validation failed", error);
    }
    try {
        const userAnsweredPreviously = await UserMealPreference.findOne({ userId: req.user._id });
        const mealQuestion = await MealPreferenceQuestion.findById(value.questionId);
        let connectedOptionValue;
        let mealSubQuestion;
        if(mealQuestion) {
            connectedOptionValue = mealQuestion.options.filter(option => option.option == value.options)[0]._id;
            mealSubQuestion = await MealPreferenceSubQuestion.find({ questionLinkedTo: value.questionId, connectedOption: connectedOptionValue});
        }
        const answeringMealQuestion = await MealPreferenceSubQuestion.findById(value.questionId);
        if(userAnsweredPreviously) {
            if(mealQuestion) {
                const alreadyAnswered = userAnsweredPreviously.valueSelected.filter( value => value.questionId.equals(mealQuestion._id) );
                if (alreadyAnswered.length > 0)
                    return ApiResponse(res, 400, "User already this question");
                const valueSelected = [
                    {
                        subQuestionExist: mealSubQuestion.length > 0 ? true : false,
                        questionId: value.questionId,
                        options: value.options.split(',').map( option => option.trim())
                    }
                ];
                const userMealPreference = {
                    userId: req.user._id,
                    valueSelected: userAnsweredPreviously.valueSelected.concat(valueSelected),
                    recommendations: []                               
                }
                try {
                    const mealPreference = await UserMealPreference.findOneAndUpdate(
                        { userId: req.user._id },
                        userMealPreference,
                        { new: true }
                    );
                    if (mealPreference) 
                        return ApiResponse(res, 201, "Meal preference updated", mealPreference);
                    else 
                        return ApiResponse(res, 500, "Meal preference could not be updated");
                } catch (err) {
                    throw new Error(err);
                    return ApiResponse(res, 500, "Internal Server Error");
                }
            } else if (answeringMealQuestion) {
                try {
                    const mainQuestion = await MealPreferenceQuestion.findOne({ _id: answeringMealQuestion.questionLinkedTo });
                    const alreadyAnswered = userAnsweredPreviously.valueSelected.some(value => {
                        if (Array.isArray(value.subQuestionExist)) {
                            return value.questionId.equals(mainQuestion._id) && value.subQuestionExist.some(sub => sub._id.equals(answeringMealQuestion._id));
                        }
                        return false;
                    });
                    console.log({alreadyAnswered: alreadyAnswered});
                    if (alreadyAnswered) {
                        return ApiResponse(res, 400, "User has already answered this question");
                    }
                    let userValues = userAnsweredPreviously.valueSelected.filter(value => {
                        return value.questionId.toString() == mainQuestion._id.toString();
                    });
                    if(userValues[0].subQuestionExist == true) {
                        const  subQuestionAnswered = {
                            _id: answeringMealQuestion._id,
                            questionId: answeringMealQuestion.questionId,
                            options: value.options.split(',').map( value => value.trim())
                        }
                        userValues[0].subQuestionExist = [subQuestionAnswered];
                        try {
                            const updateTheSubquestions = await UserMealPreference.findOneAndUpdate(
                                { "userId": req.user._id, "valueSelected._id": userValues[0]._id },
                                { 
                                    $set: { 
                                        "valueSelected.$.subQuestionExist": userValues[0].subQuestionExist,
                                        "valueSelected.$.options": userValues[0].options 
                                    } 
                                },
                                { new: true }
                            );
                            return ApiResponse(res, 200, "SubQuestion Answered", updateTheSubquestions);
                        } catch (err) {
                            throw new Error(err);
                            return ApiResponse(res, 500, "Internal Server Error");
                        }
                    } else {
                        const  subQuestionAnswered = {
                            _id: answeringMealQuestion._id,
                            questionId: answeringMealQuestion.questionId,
                            options: value.options.split(',').map( value => value.trim())
                        }
                        userValues[0].subQuestionExist.push(subQuestionAnswered);
                        try {
                            const updateTheSubquestions = await UserMealPreference.findOneAndUpdate(
                                { "userId": req.user._id, "valueSelected._id": userValues[0]._id },
                                { 
                                    $set: { 
                                        "valueSelected.$.subQuestionExist": userValues[0].subQuestionExist,
                                        "valueSelected.$.options": userValues[0].options 
                                    } 
                                },
                                { new: true }
                            );
                            return ApiResponse(res, 200, "SubQuesiton Answered",updateTheSubquestions);
                        } catch (err) {
                            throw new Error(err);
                            return ApiResponse(res, 500, "Internal Server Error");
                        }
                    }
                } catch (err) {
                    throw new Error(err);
                    return ApiResponse(res, 500, "Internal Server Error");
                }
            }
            return ApiResponse(res, 404, "Meal preference question not found");
        } else {
            if(mealQuestion) {
                const valueSelected = [
                    {
                        subQuestionExist: mealSubQuestion.length > 0 ? true : false,
                        questionId: value.questionId,
                        options: value.options.split(',').map( option => option.trim())
                    }
                ];
                const userMealPreference = {
                    userId: req.user._id,
                    valueSelected: valueSelected,
                    recommendations: []                               
                }
                try {
                    const mealPreference = await UserMealPreference.create(userMealPreference);
                    if (mealPreference) 
                        return ApiResponse(res, 201, "Meal preference updated", mealPreference);
                    else 
                        return ApiResponse(res, 500, "Meal preference could not be created");
                } catch (err) {
                    throw new Error(err);
                    return ApiResponse(res, 500, "Internal Server Error");
                }
            } 
            return ApiResponse(res, 404, "Meal preference question not found");
        }
    } catch (err) {
        throw new Error(err);
        return ApiResponse(res, 500, "Internal Server Error", error);
    }
}

const addWeeklyMealRecommendations = async (userId) => {
    let user;
    try {
        user = await User.findById(userId);
        if(!user) 
            return "User not found";
    } catch (error) {
        return "Internal Server Error";
    }

    try {
        const userRecommendations = await WeeklyMealRecommendation.findOne({ userId: userId }).sort({ weekStartDate: -1 });
        if (userRecommendations) {
            const weekDateForRecommendation = userRecommendations.weekStartDate;
            const date = new Date(weekDateForRecommendation);
            date.setDate(date.getDate() + 7);
            const weekStartDate = formatDate(date);
            let recommendations = [];
            for(let i=0; i<7; i++) {
                let obj = {
                    date: formatDate(date),
                    breakfast: [await getRandomMeal('breakfast')],
                    lunch: [await getRandomMeal('lunch')],
                    dinner: [await getRandomMeal('dinner')]
                }
                recommendations.push(obj);
                date.setDate(date.getDate() + 1);
            }
            const newRecommendation = {
                userId: userId,
                weekStartDate: weekStartDate,
                recommendations: recommendations
            }
            try {
                let newWeekRecommendation = await WeeklyMealRecommendation.findOne({ userId: userId, weekStartDate: weekStartDate });
                if (!newWeekRecommendation) {
                    try {
                        newWeekRecommendation = await WeeklyMealRecommendation.create(newRecommendation);
                        if (newWeekRecommendation) 
                            return "Weekly meal recommendation created";
                        else 
                            return "Weekly meal recommendation not created";
                    } catch (error) {
                        return "Internal Server Error";
                    }
                } else {
                    return "week recommendation already exists";
                }
            } catch (error) {
                return "Internal Server Error";
            }
        } else {
            return "weekly recommendation was suppose to be present";
        }
    } catch (error) {
        return "Internal Server Error";
    }
}

async function getRandomMeal(mealTiming) {
    const randomMeals = await Meal.aggregate([
        { $match: { mealTiming: mealTiming } },
        { $sample: { size: 1 } }
    ]);

    return randomMeals[0] ? randomMeals[0]._id : null;
}

const editUserMealPreferences = async(req, res) => {
    const MealPreferenceSchema = Joi.object({
        questionId: Joi.string().required(),
        connectedOption: Joi.string().optional(),
        options: Joi.string().optional()
    }).options({abortEarly: false});

    const { error, value } = MealPreferenceSchema.validate(req.body);
    if (error) 
        return ApiResponse(res, 400, "Validation failed", error);

    if (value.connectedOption) {
        const subQuestionExist = await UserMealPreference.aggregate([
            { $match: { userId: req.user._id } },
            { $unwind: "$valueSelected" },
            { $match: { "valueSelected.subQuestionExist": { $in: [value.questionId] } } }
        ]);
        console.log(value.questionId);
        console.log(subQuestionExist);
        return ApiTest(res, [subQuestionExist, 'sdjafsd']);
    } else {
        const questionExist = await UserMealPreference.findOneAndUpdate(
            { 
                userId: req.user._id,
                'valueSelected.questionId': value.questionId
            },
            { $set: { 'valueSelected.$.options': value.options.split(',').map(option => option.trim()) } },
            { new: true }
        ); 
        if (questionExist) {
            return ApiResponse(res, 200, "Response updated");
        } else {
            return ApiResponse(res, 404, "No such quesiton exist");
        };
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
        throw new Error(err);
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
        mealTiming: Joi.string().required(),
        rating: Joi.string().optional(),
        quantity: Joi.string().required()
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
            userInfo: req.user._id,
            mealName: value.mealName,
            calories: value.calories,
            description: value.description,
            nutrientsInfo: value.nutrientsInfo,
            tags: tagIds,
            mealTiming: value.mealTiming,
            rating: req.body.rating,
            image: mealImage.url,
            quantity: value.quantity
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
        rating: Joi.string().optional(),
        quantity: Joi.string().required()
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
                image: mealImage.url,
                quantity: value.quantity
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
        const userFavs = await UserFavouriteMeal.findOne({ userId: req.user._id });
        const userAddedMeals = await UserAddedMeal.find({ userInfo: req.user._id }).populate('tags');
        const favMealIds = userFavs ? userFavs.mealIds.map(id => id.toString()) : [];

        // Mark meals as favorited by the user
        const mealsWithFavs = meals.map(meal => ({
            ...meal.toObject(),
            isFavorited: favMealIds.includes(meal._id.toString())
        }));
        const addedMeals = userAddedMeals.map(meal => ({
            ...meal.toObject(),
            isFavourited: favMealIds.includes(meal._id.toString())
        }))
        mealsWithFavs.push(...addedMeals);
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

    let user;
    try {
        user = await User.findOne({ _id: req.user._id });
        if (!user)
            return ApiResponse(res, 404, "User not found");
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
    const firstUserRecommendedDate = new Date(user.createdAt);
    firstUserRecommendedDate.setDate(firstUserRecommendedDate.getDate()+1);
    const firstDay = firstUserRecommendedDate.getDay();

    const dateObj = new Date(value.date);
    const day = dateObj.getDay();
    const alteredDay = (day < 3) ?  (dateObj.getDate() - 7) : dateObj.getDate();
    const diff = alteredDay - day + firstDay;
    dateObj.setDate(diff);
    const weekStartDate = formatDate(dateObj);

    try {
        const mealRecommendations = await WeeklyMealRecommendation.find({
            userId: req.user._id,
            weekStartDate: weekStartDate
        })    
        .populate('recommendations.breakfast')
        .populate('recommendations.lunch')
        .populate('recommendations.dinner');
        if(mealRecommendations) {
            return ApiResponse(res, 200, "Your meal recommendations", mealRecommendations);
        } else {
            return ApiResponse(res, 400, "No recommendations found");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Internal Server Error", err);
    }
}

const getConsumedTodaysMeal = async (req, res) => {
    const consumedMealSchema = Joi.object({
        date: Joi.date().required()
    });
    const { error, value } = consumedMealSchema.validate(req.body);
    if (error) 
        return ApiResponse(res, 400, "Validation Error", error);

    try {
        const targetDate = new Date(value.date);
        const mealSelection = await UserWeeklyMealSelection.findOne({ userId: req.user._id,"recommendations.date": targetDate }).select('recommendations');
        if (mealSelection) {
            const todayConsumedMeal = mealSelection.recommendations.filter( meal => meal.date.getTime() == targetDate.getTime())[0];
            return ApiResponse(res, 200, "Today's Meal", todayConsumedMeal);
        } else {
            return ApiResponse(res, 200, "Not found");
        }
    } catch (error) {
        console.error(error);
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const addConsumedMeal = async (req, res) => {
    const schema = Joi.object({
        mealId: Joi.string().required(),
        mealTiming: Joi.string().valid('breakfast', 'lunch', 'dinner').required(),
        date: Joi.date().required()
    }).options({abortEarly: false});

    const { error, value } = schema.validate(req.body);
    if (error) {
        return ApiResponse(res, 400, "Validation failed", error.details);
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return ApiResponse(res, 404, "User not found");
        }

        let meal = await Meal.findById(value.mealId);
        if (!meal || !meal.mealTiming.includes(value.mealTiming)) {
            meal = await UserAddedMeal.findOne({ _id: value.mealId, userInfo: req.user._id });
            if (!meal || !meal.mealTiming.includes(value.mealTiming)) {
                return ApiResponse(res, 404, "Meal not recognized or meal timing is wrong");
            }
        }

        const weekStartDate = calculateWeekStartDate(user.createdAt, value.date);
        const recommendationDate = new Date(value.date);

        let mealRecord = await UserWeeklyMealSelection.findOne({ 
            userId: req.user._id, 
            weekStartDate: weekStartDate
        });

        if (mealRecord) {
            const filter = {
                userId: req.user._id,
                weekStartDate: weekStartDate
            };
        
            // Check if the element with the specific date exists
            const elementExists = await UserWeeklyMealSelection.findOne({
                userId: req.user._id,
                weekStartDate: weekStartDate,
                "recommendations.date": recommendationDate
            });
        
            if (elementExists) {
                const updateExisting = {
                    $push: { [`recommendations.$[elem].meals.${value.mealTiming}`]: meal._id },
                    $inc: { [`recommendations.$[elem].nutritionscore`]: meal.nutritionScore }
                };
        
                const options = {
                    new: true,
                    upsert: true,
                    arrayFilters: [{'elem.date': recommendationDate}]
                };
        
                mealRecord = await UserWeeklyMealSelection.findOneAndUpdate(filter, updateExisting, options);
            } else {
                const addNewElement = {
                    $push: {
                        recommendations: {
                            date: recommendationDate,
                            meals: { [value.mealTiming]: [meal._id] },
                            nutritionscore: meal.nutritionScore
                        }
                    }
                };
        
                mealRecord = await UserWeeklyMealSelection.findOneAndUpdate(filter, addNewElement, { new: true });
            }
        
            if (mealRecord) {
                await updateNutritionScore(req.user._id, meal, value.date);
                return ApiResponse(res, 200, "Consumed meal added", mealRecord);
            } else {
                return ApiResponse(res, 500, "Consumed meal could not be added");
            }
        } else {
            const record = {
                userId: user._id,
                weekStartDate,
                recommendations: [{
                    date: recommendationDate,
                    meals: { [value.mealTiming]: [meal._id] },
                    nutritionscore: meal.nutritionScore
                }]
            };

            let newRecord = await UserWeeklyMealSelection.create(record);
            if (newRecord) {
                await updateNutritionScore(req.user._id, meal, value.date);
                return ApiResponse(res, 200, "Consumed meal added", newRecord);
            } else {
                return ApiResponse(res, 500, "Consumed meal couldnt be added");
            }
        }
    } catch (error) {
        console.error(error);
        return ApiResponse(res, 500, "Internal Server Error", error);
    }
};

function calculateWeekStartDate(createdAt, targetDate) {
    const userCreatedDate = new Date(createdAt);
    userCreatedDate.setDate(userCreatedDate.getDate() + 1);
    const userCreatedDay = userCreatedDate.getDay();

    const date = new Date(targetDate);
    const day = date.getDay();
    const diff = day - userCreatedDay;
    let weekStartDate = new Date(date);
    weekStartDate.setDate(date.getDate() - (diff >= 0 ? diff : 7 + diff));
    return weekStartDate;
}

const updateNutritionScore = async (userId, meal, date) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return ApiResponse(res, 404, "User not found");
        }

        const convDate = new Date(date);

        let nutritionScore = user.nutritionscore.filter( nutrition => nutrition.date.getTime() == convDate.getTime());
        if (nutritionScore.length > 0) {
            let newNutritionScore = nutritionScore[0].score + meal.nutritionScore; 
            try {
                const filter = {
                    _id: userId,
                    'nutritionscore.date': convDate
                }
                const update = {
                    $set: { 'nutritionscore.$[elem].score': newNutritionScore }
                }
                const options = {
                    new: true,
                    arrayFilters: [{'elem.date': convDate}]
                }
                const nutrutionScoreUpdate = await User.findOneAndUpdate(filter, update, options);
                if (nutrutionScoreUpdate) {
                    return nutrutionScoreUpdate;
                } 
                return "Nutrition score not updated";
            } catch (error) {
                console.error(error);
                return "Internal Server Error";
            }
        } else {
            try {
                const filter = {
                    _id: userId,
                }
                const update = {
                    $push: { nutritionscore: { date: convDate, score: meal.nutritionScore} }
                }
                const options = {
                    new: true,
                }
                const nutrutionScoreCreate = await User.findOneAndUpdate(filter, update, options);
                if (nutrutionScoreCreate) {
                    return nutrutionScoreCreate
                }
                return "Nutrition score not created";
            } catch (error) {
                console.error(error);
                return "Internal Server Error";
            }
        }
    } catch (e) {
        console.error({ the_first_error: e});
        return "Internal Server Error";
    }
};

const meal = {
    getMealQuestions,
    addUserMealPreferences,
    editUserMealPreferences,
    getUserMealPreferences,
    addMeal,
    editMeal,
    getMeals,
    addWeeklyMealRecommendations,
    mealRecommendations,
    getConsumedTodaysMeal,
    addConsumedMeal
}

export default meal;