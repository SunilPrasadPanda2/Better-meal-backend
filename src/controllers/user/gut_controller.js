import Joi from "joi";

import User from "../../models/User.js";
import GutCleanse from "../../models/GutCleanse.js";
import GutSurveyQuestion from "../../models/GutSurveyQuestion.js";
import WeeklyMealRecommendation from "../../models/WeeklyMealRecommendation.js";
import GutSurveyAnswer from "../../models/GutSurveyAnswer.js";

import formatDate from "../../utils/formatDate.js";
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
        console.log(e);
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const addGutSurveyAnswers = async (req, res) => {
    const answerSchema = Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required()
    }).options({ abortEarly: true });
    const answerArraySchema = Joi.object({
        date: Joi.date().required(),
        answered: Joi.array().items(answerSchema)
    });
    const { error, value } = answerArraySchema.validate(req.body);
    if (error)
        return ApiResponse(res, 400, "Validation Error", error);

    try {
        const filter = {
            userId: req.user._id,
            date: value.date
        }
        const update = {
            $set: { date: value.date, answered: value.answered }
        }
        const options = {
            new: true,
            upsert: true
        }
        const gutSurveyAnswers = await GutSurveyAnswer.findOneAndUpdate(filter, update, options);
        if (gutSurveyAnswers) {
            return ApiResponse(res, 200, "Added the questions", gutSurveyAnswers);
        }
        return ApiResponse(res, 400, "Answers were not added");
    } catch (error) {
        console.error(error);
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const gutSurveyAnswers = async (req, res) => {
    const guySurveySchema = Joi.object({
        date: Joi.date().required()
    });
    const { error, value } = guySurveySchema.validate(req.body);
    if (error)
        return ApiResponse(res, 400, "Validation Error", error);

    try {
        const gutSurvey = await GutSurveyAnswer.findOne({
            userId: req.user._id,
            date: value.date
        });
        if (gutSurvey) {
            return ApiResponse(res, 200, "Survey Answers", gutSurvey);
        } else {
            return ApiResponse(res, 200, "No survey questions answered");
        }
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const gutSurveyScore = async (req, res) => {
    const surveySchema = Joi.object({
        date: Joi.date().required(),    
    }).options({abortEarly: false});
    const { error, value } = surveySchema.validate(req.body);
    if (error) 
        return ApiResponse(res, 400, "Validation Error", error);

    try {
        const gutscore = await GutSurveyAnswer.findOne({
            userId: req.user._id,
            date: value.date
        });
        if (gutscore) {
            let ans = 0;
            const answeredYes = gutscore.answered.filter( answer => {
                if (answer.answer == "yes") {
                    console.log(ans);
                    return ans++;
                }
            });
            const score = (ans >= 0 && ans <= 10) ? 70 : (ans >= 11 && ans <= 20) ? 55 : (ans >= 21 && ans <= 30) ? 50 : (ans >= 31 && ans <= 40) ? 40 : (ans > 40) ? 30 : 0;

            try {
                const filter = {
                    _id: req.user._id
                }
                const update = {
                    $push: { gutscore: { date: value.date, score: score }}
                }
                const options = {
                    new: true,
                }
                const scoreUpdate = await User.findOneAndUpdate(filter, update, options);
                if (scoreUpdate) {
                    return ApiResponse(res, 200, "Gut score update", scoreUpdate);
                }
                return ApiResponse(res, 500, "Gut score not updated");
            } catch (error) {
                console.error(error);
                return ApiResponse(res, 500, "Internal Server Error");
            }
        } else {
            return ApiResponse(res, 404, "Gut answers not found");
        }
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const gutCleanse = async (req, res) => {
    try {
        const addGutMeals = await GutCleanse.create({
            day: req.body.day,
            breakfast: [{
                meal: ["66716120ed70219f06d88678"],
                suggestion: "Black coffee or black tea with organic grass-fed ghee or coconut oil"
            }],
            lunch: [{
                meal: ["667164b658d6b68677aa9521"],
                suggestion: "1 cup white rice with spices, well cooked veggies|Snack after 3 hours - Soaked nuts of your choice, raisins and well ripened Banana (Look for allergies)"
            }],
            dinner: [],
            nutritionScore: req.body.nutritionScore
        });
        return ApiResponse(res, 201, "created", addGutMeals);
    } catch (err) {
        return ApiResponse(res, 200, "Something went wrong");
    }
}

const gutCleansingRecommendation = async (userId,res) => {
    try {
        const user = await User.findById(userId);
        if (user) {
            try {
                const createdTime = user.createdAt;
                const date = new Date(createdTime);
                date.setDate(date.getDate()+1);
 
                let existedRecommendation;
                try {
                    existedRecommendation = await WeeklyMealRecommendation.findOne({
                        userId: userId,
                        weekStartDate: formatDate(date)
                    });
                } catch (error) {
                    return null
                }
                if (!existedRecommendation) {
                    try {
                        const recommendations = await GutCleanse.find({}).select('-__v -_id');
                        if (recommendations.length > 0) {
                            const week1 = [];
                            const week2 = [];
                            recommendations.forEach(rec => {
                                const formattedDate = formatDate(date);
                                rec.date = formattedDate;
                                date.setDate(date.getDate()+1);
                                if (rec.date <= 7) {
                                    week1.push({
                                        date: new Date(formattedDate),
                                        breakfast: rec.breakfast,
                                        lunch: rec.lunch,
                                        dinner: rec.dinner
                                    });
                                } else {
                                    week2.push({
                                        date: new Date(formattedDate),
                                        breakfast: rec.breakfast,
                                        lunch: rec.lunch,
                                        dinner: rec.dinner
                                    });
                                }
                            });
                            const addRecommendation1 = {
                                userId: userId,
                                weekStartDate: week1[0].date,
                                recommendations: week1
                            }
                            const addRecommendation2 = {
                                userId: userId,
                                weekStartDate: week2[0].date,
                                recommendations: week2
                            }
                            try {
                                const weeklyMealRecommendations1 = await WeeklyMealRecommendation.create(addRecommendation1);
                                const weeklyMealRecommendations2 = await WeeklyMealRecommendation.create(addRecommendation2);
                                if (weeklyMealRecommendations1 && weeklyMealRecommendations2)
                                    return null
                                else 
                                return null
                            } catch (error) {
                                return null
                            }
                        }
                        return null
                    } catch (error) {
                        return null
                    }
                } else {
                    return null
                }
            } catch (error) {
                return null
            }
        } else {
            return null
        }
    } catch (error) {
        return null
    }
}

const gut = {
    allGutSurveyQuestions,
    addGutSurveyAnswers,
    gutSurveyAnswers,
    gutSurveyScore,
    gutCleanse,
    gutCleansingRecommendation,
}

export default gut;