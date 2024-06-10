import mongoose, { Schema } from 'mongoose';

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
    recommendations: [
        {
            date: {
                type: Date,
                required: true
            }, 
            meals: {
                breakfast: [{
                    mealId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Meal',
                        required: false
                    },
                }],
                lunch: [{
                    mealId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Meal',
                        required: false
                    },
                }],
                dinner: [{
                    mealId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Meal',
                        required: false
                    },
                }]
            }
        }
    ]
}, {
    timestamps: true
});

const WeeklyMealRecommendation = mongoose.model('WeeklyMealRecommendation', WeeklyMealRecommendationSchema);

export default WeeklyMealRecommendation;
