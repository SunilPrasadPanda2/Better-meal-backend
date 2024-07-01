import mongoose, { Schema } from 'mongoose';

const DailyMealRecommendationSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    breakfast: [{ type:Schema.Types.ObjectId, ref: 'Meal' }],
    lunch: [{ type:Schema.Types.ObjectId, ref: 'Meal' }],
    dinner: [{ type:Schema.Types.ObjectId, ref: 'Meal' }]
});

const WeeklyMealRecommendationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    weekStartDate: {
        type: Date,
        required: true,
        index: true
    },
    recommendations: {
        type: [DailyMealRecommendationSchema],
    }
}, {
    timestamps: true
});

const WeeklyMealRecommendation = mongoose.model('WeeklyMealRecommendation', WeeklyMealRecommendationSchema);

export default WeeklyMealRecommendation;