import mongoose, { Schema } from 'mongoose';

const MealPreferenceSubQuestionSchema = new Schema(
    {
        questionLinkedTo: {
            type: Schema.Types.ObjectId,
            ref: 'MealPreferenceQuestion', // this references the question _id object
            required: true,
            index: true
        },
        connectedOption: {
            type: Schema.Types.ObjectId,
            ref: 'MealPreferenceQuestion.options', // this references the option _id object
            required: true
        },
        questionId: {
            type: Number,
            required: true,
            unique: true
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
        }
    }
)

const MealPreferenceSubQuestion = mongoose.model('MealPreferenceSubQuestion', MealPreferenceSubQuestionSchema);

export default MealPreferenceSubQuestion;