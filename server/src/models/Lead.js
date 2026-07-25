import mongoose from 'mongoose';

// Unified lead-capture collection — written by every public inquiry form
// (enquiry popup, contact, hotel inquiry, private jets, partner onboarding,
// WhatsApp). Flexible shape (strict: false) since sources carry different
// extra fields (packageName, refId, etc.), but the core fields are typed.
const leadSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: 200 },
        firstName: { type: String, trim: true, maxlength: 100 },
        lastName: { type: String, trim: true, maxlength: 100 },
        phone: { type: String, trim: true, maxlength: 40 },
        email: { type: String, trim: true, lowercase: true, maxlength: 254 },
        message: { type: String, maxlength: 5000 },
        source_type: { type: String, trim: true, maxlength: 60 },
        sourcePage: { type: String, trim: true, maxlength: 300 },
        status: { type: String, default: 'new', maxlength: 40 },
    },
    { timestamps: true, strict: false },
);

export const Lead = mongoose.model('Lead', leadSchema);
