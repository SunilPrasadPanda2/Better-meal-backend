import mongoose, { Schema } from "mongoose";

const DiseaseAnswerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    answer: [{
        type: String
    }]
});

const DiseaseAnswersSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    diseaseAnswers: [DiseaseAnswerSchema]
});

const DiseaseAnswer = mongoose.model('DiseaseAnswer', DiseaseAnswersSchema);

export default DiseaseAnswer;