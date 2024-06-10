import Router from 'express';

import adminAuth from '../middlewares/adminAuth.js';
import { upload } from '../middlewares/multer.middleware.js'

import admin from '../controllers/admin/admin_controller.js';
import meal from '../controllers/admin/meal_controller.js';
import faq from '../controllers/admin/faq_controller.js';
import gut from '../controllers/admin/gut_controller.js';
import exploreSection from '../controllers/admin/explore_section_controller.js';

const router = Router();

router.route('/login').post(admin.login);

router.route('/add-tag').post(adminAuth, admin.addTag);
router.route('/all-tags').get(adminAuth, admin.allTags);

router.route('/get-meal/:_id').get(adminAuth, meal.getMeal);
router.route('/get-all-meals').get(adminAuth, meal.allMeals);
router.route('/add-meal').post(adminAuth, upload.single('image'), meal.addMeal);
router.route('/edit-meal').post(adminAuth, upload.single('image'), meal.editMeal);
router.route('/get-meal-preference-question/:questionId').get(adminAuth, meal.getMealPreferenceQuestion);
router.route('/add-meal-preference').post(adminAuth, meal.addMealPreferenceQuestion);
router.route('/edit-meal-preference').post(adminAuth, meal.editMealPreferenceQuestion);

router.route('/all-faqs').get(adminAuth, faq.allfaqs);
router.route('/get-faq/:faqId').get(adminAuth, faq.getfaq);
router.route('/add-faq').post(adminAuth, faq.add);
router.route('/edit-faq').post(adminAuth, faq.edit);
router.route('/delete-faq/:faqId').delete(adminAuth, faq.remove);

router.route('/all-gut-survey-questions').get(adminAuth, gut.allGutSurveyQuestions);
router.route('/get-gut-survey-question/:questionId').get(adminAuth, gut.getSingleGutSurveyQuestion);
router.route('/add-gut-survey-questions').post(adminAuth, gut.addSurveyQuestions);
router.route('/edit-gut-survey-question').post(adminAuth, gut.editSurveyQuestion);

router.route('/get-single-explore-section/:id').get(adminAuth, exploreSection.getSingleExploreSection);
router.route('/get-all-explore-section').get(adminAuth, exploreSection.getAllExploreSection);
router.route('/add-explore-survey').post(adminAuth, exploreSection.addForExploreSection);
router.route('/edit-explore-survey').post(adminAuth, exploreSection.editExploreSection);

export default router;