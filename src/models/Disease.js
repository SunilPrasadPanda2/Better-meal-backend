import mongoose, { Schema } from 'mongoose';

const DiseaseSchema = new Schema({
    name: {
        type: String, 
        required: true,
        index: true
    },
    image: {
        type: String,
        required: true
    },
    diseaseQuestions: [
        {
            type: String,
        }
    ]
});

const Disease = mongoose.model('Disease', DiseaseSchema);

export default Disease;