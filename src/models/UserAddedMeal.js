import mongoose, { Schema } from "mongoose";

const UserAddedMealSchema = new Schema(
    {
        userInfo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
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
        quantity: {
            type: String,
            required: true
        },
        nutrientsInfo: {
            type: mongoose.Schema.Types.Mixed,
            required: false
        },
        tags: [{
            type: Schema.Types.ObjectId,
            ref: 'Tag'
        }],
        mealTiming: {
            type: String,
            enum: ['breakfast', 'brunch', 'lunch', 'dinner'],
        },
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