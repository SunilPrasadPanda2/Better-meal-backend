import mongoose, { Schema } from "mongoose";

const AnsweredGutQuestions = new Schema({
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true
    }
});

const GutSurveyAnswerSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        required: true
    },
    answered: [AnsweredGutQuestions]
});

const GutSurveyAnswer = mongoose.model('GutSurveyAnswer', GutSurveyAnswerSchema);

export default GutSurveyAnswer;