import Joi from "joi";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import ApiResponse from "../../services/ApiResponse.js";

const allUsers = async (req, res) => {
  // if (!req.user._id) return ApiResponse(res, 403, "User not authenticated");

  // const user = await User.findById(req.user._id).select("-refreshToken");

  // if (user.role === "admin") {
    try {
      // Fetch users with the role of "user"
      const users = await User.find({ role: "user" });

      if (users.length > 0) {
        return ApiResponse(res, 200, "Users found", users);
      } else if (users) {
        return ApiResponse(res, 200, "No users found", users);
      } else {
        return ApiResponse(res, 400, "Something went wrong");
      }
    } catch (e) {
      return ApiResponse(res, 500, "Internal Server Error");
    }
  // } else {
  //   return ApiResponse(res, 403, "User not authenticated");
  // }
};

const removeUser = async (req, res) => {
  // if (!req.user._id) return ApiResponse(res, 403, "User not authenticated");
  // const admin = await User.findById(req.user._id).select("-refreshToken");
  // if (admin.role === "admin") {
    const userId = req.params._id;
    if (!userId) return ApiResponse(res, 400, "Please enter userId");

    try {
      let user = await User.deleteOne({ _id: userId });
      if (user.acknowledged == true) {
        return ApiResponse(res, 201, "User deleted");
      } else {
        return ApiResponse(res, 500, "User not deleted");
      }
    } catch (err) {
      return ApiResponse(res, 500, "Something went wrong");
    }
  // } else {
  //   return ApiResponse(res, 403, "User not authenticated");
  // }
};

const users = {
  allUsers,
  removeUser,
};

export default users;
