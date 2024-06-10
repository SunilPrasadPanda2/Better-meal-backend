import mongoose, { Schema } from "mongoose";

const MealPreferenceQuestionSchema = new Schema(
    {
        questionId: {
            type: Number,
            required: true,
            allowNull: true,
            unique: true,
        },
        question: {
            type: String,
            required: true,
            allowNull:false,
            index: true
        },
        options: {
            type: [{
                option: {
                    type: String,
                    required: true,
                },
                mealIds: [{
                    type: Schema.Types.ObjectId,
                    ref: 'Meal',
                    required: false
                }]
            }],
            required: true,
        }
    }
);

const MealPreferenceQuestion = mongoose.model('MealPreferenceQuestion', MealPreferenceQuestionSchema);

export default MealPreferenceQuestion;