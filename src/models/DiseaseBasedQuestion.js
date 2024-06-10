import mongoose, { Schema } from 'mongoose';

const DiseaseBasedQuestionSchema = new Schema({
    question: {
        type: String,
        required: true
    },
    diseaseId: {
        type: Schema.Types.ObjectId,
        ref: 'Disease',
        required: true
    }
});

const DiseaseBasedQuestion = new mongoose.model('DiseaseBasedQuestion', DiseaseBasedQuestionSchema);

export default DiseaseBasedQuestion;