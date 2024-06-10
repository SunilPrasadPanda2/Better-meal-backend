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
            type:Schema.Types.ObjectId,
            ref: 'DiseaseBasedQuestion'
        }
    ]
});

const Disease = new mongoose.model('Disease', DiseaseSchema);

export default Disease;