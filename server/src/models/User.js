import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
    },
    { timestamps: true },
);

// Never leak the password hash in JSON responses.
userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
    },
});

export const User = mongoose.model('User', userSchema);
