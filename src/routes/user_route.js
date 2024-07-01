import Router from 'express';
import { OAuth2Client } from 'google-auth-library';

import auth from '../middlewares/auth.js';
import { upload } from "../middlewares/multer.middleware.js";

import gut from '../controllers/user/gut_controller.js';
import user from '../controllers/user/user_controller.js';
import meal from '../controllers/user/meal_controller.js';
import disease from '../controllers/user/disease_controller.js'
import medication from '../controllers/user/medication_controller.js';
import favouriteMeals from '../controllers/user/favourite_meal_controller.js';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_AUTH_CLIENT_ID);

router.route('/send-otp').post(user.sendOtp);
router.route('/phone-verification').post(user.phoneVerificationOtp);
router.route('/signup').post(user.signup);
router.route('/login').post(user.login);
router.route('/forgot-password').post(user.forgotPassword);
router.route('/profile-update').post(auth, upload.single('image'), user.updateProfile); //if profile is updated then the gut cleanse recommendation will be added.
router.route('/change-password').post(auth, user.changePassword);

router.route('/get-dashboard-scores').get(auth, user.getDashboardScore);
router.route('/explore-section').post(auth, user.exploreSection);

router.route('/get-meal-questions').get(auth, meal.getMealQuestions);
router.route('/send-meal-preference').post(auth, meal.addUserMealPreferences);
router.route('/edit-meal-preference').post(auth, meal.editUserMealPreferences);
router.route('/get-meal-preference').get(auth, meal.getUserMealPreferences);

router.route('/add-meal').post(auth, upload.single('image'), meal.addMeal);
router.route('/edit-meals').post(auth, upload.single('image'), meal.editMeal);
router.route('/get-meal').get(auth, meal.getMeals);

router.route('/meal-recommendation').post(auth, meal.mealRecommendations);
router.route('/get-consumed-meal-for-today').post(auth, meal.getConsumedTodaysMeal);
router.route('/add-consumed-meal').post(auth, meal.addConsumedMeal);

router.route('/favourite-meals').get(auth, favouriteMeals.favouriteMeal);
router.route('/add-favourite-meal').post(auth, favouriteMeals.addFavouriteMeal);
router.route('/remove-favourite-meal').post(auth, favouriteMeals.removeFavouriteMeal);

router.route('/all-gut-survey-questions').get(auth, gut.allGutSurveyQuestions);
router.route('/add-gut-survey-answers').post(auth, gut.addGutSurveyAnswers);
router.route('/gut-survey-answers').post(auth, gut.gutSurveyAnswers);
router.route('/gut-survey-score').post(auth, gut.gutSurveyScore);

router.route('/get-medications').get(auth, medication.getMedications);
router.route('/add-medications').post(auth, medication.addMedications);
router.route('/remove-medications').post(auth, medication.removeMedications);

router.route('/get-all-diseases').get(auth, disease.getAllDiseases);
router.route('/get-answered-questions').get(auth, disease.getAnsweredQuestions);
router.route('/disease-score-calculation').post(auth, disease.answerDiseaseQuestions);

router.route('/add-gut-cleanse').post(auth, gut.gutCleanse);

export default router;

//for test only
// router.route('/add-weekly-recommend').post(auth, meal.addWeeklyMealRecommendations);
