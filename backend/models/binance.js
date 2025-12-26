import mongoose from 'mongoose';

const binanceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    apiKey: {
        type: String,
        required: true
    },
    secretKey: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'inactive'
    },
    balances: [{
        asset: String,
        free: String,
        locked: String
    }],
    settings: {
        autoTrade: { type: Boolean, default: false },
        riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Binance = mongoose.model('Binance', binanceSchema);

export default Binance;
