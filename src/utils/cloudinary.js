import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    console.log(localFilePath);
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfully
    // console.log("File upload on cloudinary", response.url);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary fiile as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async (clodinaryFilePath) => {
  try {
    if (!clodinaryFilePath) return null;

    // delete from cloudinary

    const fileArray = clodinaryFilePath.split("/");
    const fileWithExtension = fileArray[fileArray.length - 1];
    const publicIdArray = fileWithExtension.split(".");
    const publicId = publicIdArray[0];
    console.log(publicId);
    const response = await cloudinary.uploader.destroy(`image/upload/${publicId}`, {
      resource_type: "auto",
    });

    console.log(response);
    return response;
  } catch (error) {
    fs.unlinkSync(clodinaryFilePath);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
