import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        required: true,
        unique: true
    },
    username: String,
    firstName: String,
    lastName: String,
    role: {
        type: String,
        enum: ['user', 'vip', 'admin'],
        default: 'user'
    },
    isAuth: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    binanceAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Binance'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

export default User;
