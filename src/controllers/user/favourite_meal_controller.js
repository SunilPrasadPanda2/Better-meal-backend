import UserFavouriteMeal from "../../models/UserFavouriteMeal.js";
import ApiResponse from "../../services/ApiResponse.js";
import Meal from "../../models/Meal.js"

const favouriteMeal = async (req, res) => {
    try {
        const userFavourites = await UserFavouriteMeal.find({}).populate({path: 'mealIds'});
        if (userFavourites.length > 0) {
            return ApiResponse(res, 200, "User Favourites Found", userFavourites);
        } else {
            return ApiResponse(res, 404, "No Favourites Added Yet");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Internal Server Error", err.message);
    }
}

const addFavouriteMeal = async (req, res) => {
    try {
        const favouriteMeal = await Meal.findOne({ _id: req.body._id });
        if(favouriteMeal) {
            let userMealFavourites = await UserFavouriteMeal.findOne({userId: req.user._id});
            if(userMealFavourites) {
                const mealFavouriteExists = userMealFavourites.mealIds.includes(favouriteMeal._id);
                if(mealFavouriteExists) {
                    return ApiResponse(res, 409, "This meal is already favourited", userMealFavourites);
                }
                const userMealPreference = await UserFavouriteMeal.updateOne(
                    { userId: req.user._id},
                    { $push:  {mealIds: favouriteMeal._id}}
                )
                if(userMealPreference.modifiedCount > 0) {
                    return ApiResponse(res, 200, "Added to your favorites", userMealPreference);
                } else {
                    return ApiResponse(res, 400, "Couldn't add to your favourite meal");
                }
            } else {
                const userFavourites = {
                    userId: req.user._id,
                    mealIds: [favouriteMeal._id]
                }
                userMealFavourites = await UserFavouriteMeal.create(userFavourites);
                if(userMealFavourites) {
                    return ApiResponse(res, 201, "Added to favourite Meal", userMealFavourites);
                } else {
                    return ApiResponse(res, 400, "Couldn't add to favourite Meal");
                }
            }
        } else {
            return ApiResponse(res, 404, "Meal not found");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Internal Server Error", err.message);
    }
}

const removeFavouriteMeal = async (req, res) => {
    try {
        const favouriteMeal = await Meal.findOne({ _id: req.body._id });
        if(favouriteMeal) {
            let userMealFavourites = await UserFavouriteMeal.findOne({userId: req.user._id});
            if(userMealFavourites) {
                const mealFavouriteExists = userMealFavourites.mealIds.includes(favouriteMeal._id);
                if(mealFavouriteExists) {
                    const userMealFavouritesUpdated = await UserFavouriteMeal.updateOne(
                        { userId: req.user._id},
                        { $pull: { mealIds: favouriteMeal._id }}
                    )
                    if(userMealFavouritesUpdated.modifiedCount > 0) {
                        return ApiResponse(res, 200, "Meal removed from your favourites", userMealFavouritesUpdated);
                    } else {
                        return ApiResponse(res, 400, "Couldn't remove this meal from your favourite meal");
                    }
                } else {
                    return ApiResponse(res, 400, "The meal is already removed from your favorites", userMealFavourites);
                }
            } else {
                return ApiResponse(res, 404, "No favourite meals added for this use yet");
            }
        } else {
            return ApiResponse(res, 404, "Meal not found");
        }
    } catch (err) {
        return ApiResponse(res, 500, "Internal Server Error", err.message);
    }
}

const favouriteMeals = {
    favouriteMeal,
    addFavouriteMeal,
    removeFavouriteMeal
}

export default favouriteMeals;