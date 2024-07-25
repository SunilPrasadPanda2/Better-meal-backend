import Joi from "joi";
import User from "../../models/User.js";
import ApiResponse from "../../services/ApiResponse.js";

const getMedications = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id});
        if(user) {
            let medication = user.medication;
            if (medication.length > 0) {
                return ApiResponse(res, 200, "Medications present", medication);
            } else {
                return ApiResponse(res, 200, "No Medication present");
            }
        } else {
            return ApiResponse(res, 404, "User not found");
        }
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const addMedications = async (req, res) => {
    const medicationsSchema = Joi.object({
        medication: Joi.string().required()
    });
    const { error, value } = medicationsSchema.validate(req.body);

    if(error) 
        return ApiResponse(res, 400, "Validation failed", error);

    try {
        const user = await User.findOne({ _id: req.user._id});
        if(medication) {
            let existingMedication = user.medication;
            let newMedication = value.medication.split(',').map( medication => medication.trim());
            let addMedication = newMedication.filter(med => !existingMedication.includes(med));
            try {
                const filter = {
                    _id: user._id
                }
                const update = {
                    $push: { medication: { $each: addMedication } }
                } 
                const options = {
                    new:true
                }
                const userUpdate = await User.findOneAndUpdate(filter, update, options);
                if (userUpdate) {
                    return ApiResponse(res, 200, "Meal updated", userUpdate);
                } else {
                    return ApiResponse(res, 500, "Could not add the medication");
                }
            } catch (error) {
                return ApiResponse(res, 500, "Internal Server Error");
            }
        } else {
            return ApiResponse(res, 404, "User not found");
        }
    } catch (error) {
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const removeMedications = async (req, res) => {
    const medicationsSchema = Joi.object({
        medication: Joi.string().required()  // Ensures a medication name is provided
    });
    const { error, value } = medicationsSchema.validate(req.body);

    if (error) 
        return ApiResponse(res, 400, "Validation failed", error.details[0].message);

    try {
        const user = await User.findOne({ _id: req.user._id });
        if (!user) {
            return ApiResponse(res, 404, "User not found");
        }

        // Split and trim the medication names from the request
        const medicationsToRemove = value.medication.split(',').map(med => med.trim());

        // Filter out the medications to remove from the user's existing medication list
        const updatedMedications = user.medication.filter(med => !medicationsToRemove.includes(med));

        // Check if any medication was actually removed
        if (updatedMedications.length === user.medication.length) {
            return ApiResponse(res, 404, "Medication not found in the user's list");
        }

        // Update the user's medication list
        user.medication = updatedMedications;
        await user.save();

        return ApiResponse(res, 200, "Medications removed successfully", user);
    } catch (error) {
        console.error(error);
        return ApiResponse(res, 500, "Internal Server Error");
    }
}

const medication = {
    getMedications,
    addMedications,
    removeMedications,
}

export default medication;