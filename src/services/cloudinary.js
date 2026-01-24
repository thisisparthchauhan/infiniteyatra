/**
 * Cloudinary Image Upload Service
 * 
 * Configuration:
 * Replace these values with your actual Cloudinary credentials.
 * It is recommended to use Environment Variables in a production setting.
 */
const CLOUD_NAME = "dsi4mdylh"; // Updated from user screenshot
const UPLOAD_PRESET = "infinite_unsigned"; // Checked and verified

/**
 * Uploads a single file to Cloudinary
 * @param {File} file - The file object to upload
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (file) => {
    if (!file) throw new Error("No file provided");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Upload failed");
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
};

/**
 * Uploads multiple files to Cloudinary in parallel
 * @param {File[]} files - Array of file objects
 * @returns {Promise<string[]>} - Array of secure URLs
 */
export const uploadMultipleToCloudinary = async (files) => {
    try {
        const uploadPromises = files.map(file => uploadToCloudinary(file));
        const urls = await Promise.all(uploadPromises);
        return urls;
    } catch (error) {
        console.error("Batch Upload Error:", error);
        throw error;
    }
};
