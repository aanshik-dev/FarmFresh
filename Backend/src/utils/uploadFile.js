import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

/**
 * Upload any supported buffer (image or PDF) to Cloudinary.
 * `resource_type: "auto"` lets Cloudinary keep PDFs as documents while still
 * handling images normally — payment proofs come in both shapes.
 * @param {Buffer} buffer
 * @param {string} folder
 * @param {string} fileName
 * @param {object} extraOptions - optional Cloudinary upload options (e.g. { overwrite: false })
 */
const uploadFile = (buffer, folder, fileName, extraOptions = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName,
        overwrite: true,
        resource_type: "auto",
        ...extraOptions,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export default uploadFile;
