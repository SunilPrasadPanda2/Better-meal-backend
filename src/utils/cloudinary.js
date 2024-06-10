import { v2 as cloudinary } from  "cloudinary";
import fs from "fs";



cloudinary.config({
  cloud_name: "dzqtyxnb5",
  api_key: 863217252592351,
  api_secret: "_m1cyLOMbdUyCk5e7rja1qL4nqs",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log(error);
    fs.unlinkSync(localFilePath); 
    return null;
  }
};



export {uploadOnCloudinary}
