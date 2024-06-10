import mongoose, { Schema } from "mongoose";

const UserMealPreferenceSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true,
        index: true
    },
    valueSelected: {
        type: [
            {
                questionId: {
                    type:Schema.Types.ObjectId,
                    ref: "MealPreferenceQuestion",
                },
                options: {
                    type: Array,
                },
                recommendations: [{
                    type: Schema.Types.ObjectId,
                    ref: "Meal"
                }]
            }
        ],
    },
    userRecommendations: [
        {
            type: Schema.Types.ObjectId,
            ref: "Meal"
        }
    ]
}, {
    timestamps: true
});

const UserMealPreference = mongoose.model("UsermealPreference", UserMealPreferenceSchema);

export default UserMealPreference;