"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateTelegram = void 0;
const TelegramAuth_1 = require("../auth/TelegramAuth");
const crypto_1 = __importDefault(require("crypto"));
const authenticateTelegram = async (req, res) => {
    console.log('🚀 NEW CONTROLLER: authenticateTelegram started!');
    try {
        const { initData } = req.body;
        // Детальное логирование
        console.log('🔐 HTTP Telegram authentication attempt');
        console.log('📄 Received auth data:', {
            hasInitData: !!initData,
            initDataLength: initData?.length || 0,
            userExists: !!initData?.includes('user=')
        });
        if (!initData) {
            console.log('❌ No initData in request body');
            return res.status(400).json({
                success: false,
                error: 'initData is required'
            });
        }
        // ПОШАГОВАЯ ДИАГНОСТИКА
        console.log('🔍 Step 1: Checking validation...');
        const isValid = TelegramAuth_1.TelegramAuth.validateTelegramInitData(initData);
        console.log('🔍 Validation result:', isValid);
        if (!isValid) {
            console.log('❌ Validation failed');
            return res.status(401).json({
                success: false,
                error: 'Invalid Telegram signature'
            });
        }
        console.log('🔍 Step 2: Extracting user...');
        const user = TelegramAuth_1.TelegramAuth.extractAndValidateUser(initData);
        console.log('🔍 Extracted user:', user ? { id: user.id, name: user.first_name } : 'null');
        if (!user) {
            console.log('❌ No user data extracted');
            return res.status(400).json({
                success: false,
                error: 'No user data found in initData'
            });
        }
        console.log('🔍 Step 3: Generating token...');
        const token = TelegramAuth_1.TelegramAuth.generateAuthToken(user);
        const sessionId = crypto_1.default.randomUUID();
        const player = {
            id: `tg_${user.id}`,
            name: user.first_name,
            telegramId: user.id,
            username: user.username,
            avatar: user.photo_url,
            isReady: false
        };
        console.log('✅ Authentication successful for user:', user.id);
        const response = {
            success: true,
            token,
            sessionId,
            user: player,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.authenticateTelegram = authenticateTelegram;
//# sourceMappingURL=authController.js.map