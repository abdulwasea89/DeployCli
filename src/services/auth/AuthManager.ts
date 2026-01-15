import { sessionStorage, AuthState } from '../session/sessionStorage.ts';

export class AuthManager {
    private static instance: AuthManager;
    private isChecking = false;

    private constructor() {}

    static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    async login(code: string): Promise<AuthState | null> {
        const authServerUrl = process.env.AUTH_SERVER_URL || 'http://localhost:3001';
        try {
            const pollResp = await fetch(`${authServerUrl}/custom/auth/poll?code=${code}`);
            const pollData = await pollResp.json();

            if (pollData.authenticated) {
                if (!pollData.sessionToken) {
                    console.log(`Poll: Code ${code} authenticated but sessionToken is missing`);
                    return null;
                }

                // Fetch user details using our custom validate endpoint
                const userResp = await fetch(`${authServerUrl}/custom/auth/validate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionToken: pollData.sessionToken })
                });
                
                const userData = await userResp.json();

                if (userData.valid && userData.user) {
                    console.log(`Poll: Successfully validated session for ${userData.user.email}`);
                    await sessionStorage.saveSession(
                        pollData.sessionToken,
                        userData.user.id,
                        userData.user.name || '',
                        userData.user.email || ''
                    );
                    
                    return await sessionStorage.loadSession();
                } else {
                    console.log(`Poll: Session validation failed for token: ${pollData.sessionToken.substring(0, 10)}... Error: ${userData.error}`);
                }
            }
        } catch (err) {
            console.error('Login polling failed:', err);
        }
        return null;
    }

    async logout(): Promise<void> {
        await sessionStorage.clearSession();
    }

    async checkAuth(): Promise<AuthState | null> {
        const session = await sessionStorage.loadSession();
        if (!session) return null;

        const authServerUrl = process.env.AUTH_SERVER_URL || 'http://localhost:3001';
        try {
            const response = await fetch(`${authServerUrl}/custom/auth/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken: session.sessionToken })
            });

            const data = await response.json();
            if (data.valid) {
                return session;
            } else {
                await sessionStorage.clearSession();
                return null;
            }
        } catch (error) {
            // If offline, we might want to keep the session or show a warning
            // For now, let's assume valid if network is just down
            return session;
        }
    }

    async initiateLogin(): Promise<{ code: string; url: string }> {
        const authServerUrl = process.env.AUTH_SERVER_URL || 'http://localhost:3001';
        const response = await fetch(`${authServerUrl}/custom/auth/initiate`, { method: "POST" });
        if (!response.ok) throw new Error('Failed to initiate login');
        return await response.json();
    }
}

export const authManager = AuthManager.getInstance();
