import mongoose, { Schema } from 'mongoose';

const UserWeeklyMealSelectionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    weekStartDate: {
        type: Date,
        required: true
    },
    recommendations: [
        {
            date: {
                type: Date,
                required: true
            },
            meals: {
                breakfast: [{
                    type: Schema.Types.ObjectId,
                    ref: 'Meal',
                    required: false
                }],
                lunch: [{
                    type: Schema.Types.ObjectId,
                    ref: 'Meal',
                    required: false
                }],
                dinner: [{
                    type: Schema.Types.ObjectId,
                    ref: 'Meal',
                    required: false
                }]
            },
            nutritionscore: {
                type: Number,
                default: 0
            }
        }
    ]
}, {
    timestamps: true
});

const UserWeeklyMealSelection = mongoose.model('UserWeeklyMealSelection', UserWeeklyMealSelectionSchema);

export default UserWeeklyMealSelection;
