import Router from 'express';

import adminAuth from '../middlewares/adminAuth.js';
import { upload } from '../middlewares/multer.middleware.js'

import admin from '../controllers/admin/admin_controller.js';
import meal from '../controllers/admin/meal_controller.js';
import faq from '../controllers/admin/faq_controller.js';
import gut from '../controllers/admin/gut_controller.js';
import disease from '../controllers/admin/disease_controller.js';
import exploreSection from '../controllers/admin/explore_section_controller.js';
import users from '../controllers/admin/user_controller.js';

const router = Router();

router.route('/login').post(admin.login);
router.route('/dashboard').get(admin.dashboard);

router.route('/add-tag').post(adminAuth, admin.addTag);
router.route('/all-tags').get(adminAuth, admin.allTags);
router.route('/delete-tag/:tagId').delete(adminAuth, admin.removeTag);

router.route('/get-meal/:_id').get(adminAuth, meal.getMeal);
router.route('/get-all-meals').get(adminAuth, meal.allMeals);
router.route('/add-meal').post(adminAuth, upload.single('image'), meal.addMeal);
router.route('/edit-meal').post(adminAuth, upload.single('image'), meal.editMeal);
router.route('/delete-meal').delete(adminAuth, meal.removeMeal);
router.route('/get-all-meal-questions').get(adminAuth, meal.getAllMealQuestions);
router.route('/get-meal-preference-question/:questionId').get(adminAuth, meal.getMealPreferenceQuestion);
router.route('/add-meal-preference').post(adminAuth, meal.addMealPreferenceQuestion);
router.route('/edit-meal-preference').post(adminAuth, meal.editMealPreferenceQuestion);
router.route('/delete-mealPreference-question').delete(adminAuth, meal.removeMealPreferenceQuestion);

router.route('/get-all-meal-subquestions/:questionId').get(adminAuth, meal.getAllConnectedSubQuestions);
router.route('/get-single-meal-subquestions/:questionId').get(adminAuth, meal.getSingleConnectedSubQuestion);
router.route('/add-meal-preference-subquestion').post(adminAuth, meal.addMealPreferenceSubQuestion);
router.route('/edit-meal-preference-subquestion').post(adminAuth, meal.editMealPreferenceSubQuestion);
router.route('/remove-meal-preference-subquestion').delete(adminAuth, meal.removeMealPreferenceSubQuestion);

router.route('/all-faqs').get(adminAuth, faq.allfaqs);
router.route('/get-faq/:faqId').get(adminAuth, faq.getfaq);
router.route('/add-faq').post(adminAuth, faq.add);
router.route('/edit-faq').post(adminAuth, faq.edit);
router.route('/delete-faq/:faqId').delete(adminAuth, faq.remove);

router.route('/all-gut-survey-questions').get(adminAuth, gut.allGutSurveyQuestions);
router.route('/get-gut-survey-question/:questionId').get(adminAuth, gut.getSingleGutSurveyQuestion);
router.route('/add-gut-survey-questions').post(adminAuth, gut.addSurveyQuestions);
router.route('/edit-gut-survey-question').post(adminAuth, gut.editSurveyQuestion);
router.route('/remove-gut-question').delete(adminAuth, gut.removeGutSurveyQuestion);

router.route('/get-single-explore-section/:id').get(adminAuth, exploreSection.getSingleExploreSection);
router.route('/get-all-explore-section').get(adminAuth, exploreSection.getAllExploreSection);
router.route('/add-explore-survey').post(adminAuth, upload.single('image'), exploreSection.addForExploreSection);
router.route('/edit-explore-survey').post(adminAuth, upload.single('image'), exploreSection.editExploreSection);
router.route('/remove-explore').delete(adminAuth, exploreSection.removeExplore);

router.route('/add-diseases').post(adminAuth, upload.single('image'), disease.addDisease);
router.route('/add-disease-questions').post(adminAuth, disease.addDiseaseQuestions);

router.route('/users').get(users.allUsers);
router.route("/removeUser/:_id").get( users.removeUser);

export default router;