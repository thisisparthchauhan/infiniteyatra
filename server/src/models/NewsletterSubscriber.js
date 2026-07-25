import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema(
    {
        // unique index dedupes subscribers at the DB level — no client-side
        // list query needed (that was the old Firestore permission problem).
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
        source: { type: String, trim: true, maxlength: 60, default: 'footer' },
    },
    { timestamps: true },
);

export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSchema);
