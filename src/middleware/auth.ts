export const authMiddleware = (isLoggedIn: boolean) => {
    if (!isLoggedIn) {
        throw new Error('Unauthorized Access: Please use /login');
    }
    return true;
};
