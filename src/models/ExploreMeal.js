import mongoose, { Schema } from 'mongoose';

const ExploreMealSchema = new Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    image: {
        type: String,
    },
    advice: {
        type: String,
    },
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date
    }
});

const ExploreMeal = new mongoose.model('ExploreMeal', ExploreMealSchema);

export default ExploreMeal;