import mongoose, { Schema } from "mongoose";

const UserAddedMealSchema = new Schema(
    {
        userInfo: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        mealName: {
            type: String,
            required: true, 
            allowNull: false,
            unique: true
        },
        calories: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
            allowNull: false,
        },
        nutrientsInfo: {
            type: mongoose.Schema.Types.Mixed,
            required: false
        },
        tags: [{
            type: Schema.Types.ObjectId,
            ref: 'Tag'
        }],
        rating: {
            type: String,
            required: false,
        },
        image: {
            type:String,
            required: false,
            allowNull:true
        }
    }
);

const UserAddedMeal = mongoose.model('UserAddedMeal', UserAddedMealSchema);

export default UserAddedMeal;