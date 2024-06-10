import mongoose, { Schema } from 'mongoose';

const UserFavouriteMealSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    mealIds: [{
        type: Schema.Types.ObjectId,
        ref: "Meal"
    }]
});

const UserFavouriteMeal = mongoose.model('UserFavouriteMeal', UserFavouriteMealSchema);

export default UserFavouriteMeal;