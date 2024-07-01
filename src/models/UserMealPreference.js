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
                subQuestionExist: {
                    type: mongoose.Schema.Types.Mixed,
                    required: true
                },
                questionId: {
                    type:Schema.Types.ObjectId,
                    ref: "MealPreferenceQuestion"
                },
                options: {
                    type: Array,
                },
            }
        ],
    },
    userRecommendations: [
        {
            type: Schema.Types.ObjectId,
            ref: "Meal",
            required:false
        }
    ]
}, {
    timestamps: true
});

const UserMealPreference = mongoose.model("UsermealPreference", UserMealPreferenceSchema);

export default UserMealPreference;