import mongoose, { Schema } from 'mongoose';

const GutSurveyQuestionSchema = new Schema({
    question: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'any'],
        requierd: true
    }
});

const GutSurveyQuestion = mongoose.model('Gut', GutSurveyQuestionSchema);

export default GutSurveyQuestion;