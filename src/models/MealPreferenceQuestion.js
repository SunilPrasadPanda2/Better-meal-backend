import mongoose, { Schema } from "mongoose";

const MealPreferenceQuestionSchema = new Schema(
    {
        questionId: {
            type: Number,
            required: true,
            unique: true,
        },
        question: {
            type: String,
            required: true,
            index: true
        },
        options: {
            type: [{
                option: {
                    type: String,
                    required: true,
                },
            }],
            required: true,
        },
        subQuestions: [{
            type: Schema.Types.ObjectId,
            ref: 'MealPreferenceSubQuestion'
        }]
    }
);

const MealPreferenceQuestion = mongoose.model('MealPreferenceQuestion', MealPreferenceQuestionSchema);

export default MealPreferenceQuestion;