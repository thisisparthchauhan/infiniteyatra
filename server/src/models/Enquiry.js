import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
    {
        firstName: { type: String, trim: true, maxlength: 100 },
        lastName: { type: String, trim: true, maxlength: 100 },
        name: { type: String, trim: true, maxlength: 200 },
        mobile: { type: String, trim: true, maxlength: 40 },
        fullMobile: { type: String, trim: true, maxlength: 40 },
        email: { type: String, trim: true, lowercase: true, maxlength: 254 },
        message: { type: String, maxlength: 5000 },
        source: { type: String, trim: true, maxlength: 300 },
    },
    { timestamps: true, strict: false },
);

export const Enquiry = mongoose.model('Enquiry', enquirySchema);
