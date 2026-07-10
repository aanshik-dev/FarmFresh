import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

// Upload image buffer to Cloudinary
const uploadImage = (buffer, folder, fileName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName,
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export default uploadImage;
