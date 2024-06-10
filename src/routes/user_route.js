import Router from 'express';

import auth from '../middlewares/auth.js';
import { upload } from "../middlewares/multer.middleware.js";

import user from '../controllers/user/user_controller.js';
import meal from '../controllers/user/meal_controller.js';
import favouriteMeals from '../controllers/user/favourite_meal_controller.js';
import gut from '../controllers/user/gut_controller.js';


const router = Router();

router.route('/send-otp').post(user.sendOtp);
router.route('/phone-verification').post(user.phoneVerificationOtp);
router.route('/signup').post(user.signup);
router.route('/login').post(user.login);
router.route('/forgot-password').post(user.forgotPassword);
router.route('/profile-update').post(auth, upload.single('image'), user.updateProfile);
router.route('/change-password').post(auth, user.changePassword);

router.route('/get-meal-questions').get(auth, meal.MealQuestions);
router.route('/send-meal-preference').post(auth, meal.addUserMealPreferences);
router.route('/edit-meal-preference').post(auth, meal.editUserMealPreferences);
router.route('/get-meal-preference').get(auth, meal.getUserMealPreferences);
router.route('/add-meal').post(auth, upload.single('image'), meal.addMeal);
router.route('/edit-meals').post(auth, upload.single('image'), meal.editMeal);
router.route('/get-meal').get(auth, meal.getMeals);
router.route('/meal-recommendation').get(auth, meal.mealRecommendations);

router.route('/favourite-meals').get(auth, favouriteMeals.favouriteMeal);
router.route('/add-favourite-meal').post(auth, favouriteMeals.addFavouriteMeal);
router.route('/remove-favourite-meal').post(auth, favouriteMeals.removeFavouriteMeal);

router.route('/all-gut-survey-questions').get(auth, gut.allGutSurveyQuestions);
router.route('/add-medications').post(auth, gut.addMedications);

export default router;