import mongoose, { Schema } from 'mongoose';

const GutMealSchema = new Schema({
    meal : {
        type: Schema.Types.ObjectId,
        ref: 'Meal'
    },
    suggestion: {
        type: String,
    }
});

const GutCleanseSchema = new Schema({
    date: {
        type: Number,
    },
    lunch: [GutMealSchema],
    breakfast: [GutMealSchema],
    dinner: [GutMealSchema],
    nutritionScore: {
        type: Number,
        required: true
    }
});

const GutCleanse = mongoose.model('GutCleanse', GutCleanseSchema);

export default GutCleanse;