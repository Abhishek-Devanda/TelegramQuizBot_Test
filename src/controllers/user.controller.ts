import User, { type IUser } from '../models/User';
import type { User as TelegramUser } from 'telegraf/types';

export const registerOrUpdateUser = async (telegramUser: TelegramUser): Promise<IUser | null> => {
    if (!telegramUser) {
        console.error('registerOrUpdateUser called with undefined telegramUser');
        return null;
    }
    const { id: telegramUserId, first_name: firstName, last_name: lastName, username } = telegramUser;

    try {
        let user = await User.findOne({ telegramUserId });
        if (!user) {
            user = new User({
                telegramUserId,
                firstName,
                lastName: lastName,
                username,
            });
            await user.save();
            console.log(`New user registered: ${username ?? firstName} (ID: ${telegramUserId})`);
            return user;
        } else {
            // User exists, update if necessary
            let updated = false;
            if (user.firstName !== firstName) { user.firstName = firstName; updated = true; }
            if (user.lastName !== (lastName)) { user.lastName = lastName; updated = true; }
            if (user.username !== username) { user.username = username; updated = true; }

            if (updated) {
                await user.save();
                console.log(`User details updated: ${username ?? firstName} (ID: ${telegramUserId})`);
            }
            return user;
        }
    } catch (error) {
        console.error(`Error registering or updating user ${telegramUserId}:`, error);
        return null;
    }
};