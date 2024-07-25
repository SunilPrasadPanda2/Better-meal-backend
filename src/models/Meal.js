import mongoose, { Schema } from "mongoose";

const MealsSchema = new Schema(
    {
        mealName: {
            type: String,
            required: true,
        },
        quantity: {
            type: String,
            required: true
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
        nutritionScore: {
            type: Number,
            required: true
        },
        mealTiming: {
            type: [{ type: String, enum: ['breakfast', 'brunch', 'lunch', 'dinner'] }],
            required: true
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
        },
    }
);

const Meal = mongoose.model('Meal', MealsSchema);

export default Meal;