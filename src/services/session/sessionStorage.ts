import { FileStorage } from '../auth/storage/FileStorage.ts';
import { KeychainStorage } from '../auth/storage/KeychainStorage.ts';
import { AuthState, IAuthStorage } from '../auth/storage/types.ts';

class MultiLayerStorage {
    private fileStorage: FileStorage;
    private keychainStorage: KeychainStorage;
    private currentProfile: string = 'default';

    constructor() {
        this.fileStorage = new FileStorage();
        this.keychainStorage = new KeychainStorage();
    }

    private async getBestStorage(): Promise<IAuthStorage> {
        // We prefer keychain but will fall back to file if keychain is unavailable
        // (In some Linux environments without DBUS/Keyring, keytar might fail)
        try {
            // Test if keychain works by doing a dummy operation
            // Not really efficient, but safe. 
            // Alternatively, we can just try/catch on every operation.
            return this.keychainStorage;
        } catch {
            return this.fileStorage;
        }
    }

    async saveSession(token: string, userId: string, userName: string, userEmail: string): Promise<void> {
        const state: AuthState = {
            sessionToken: token,
            userId,
            userName,
            userEmail,
            savedAt: new Date().toISOString()
        };

        // Attempt to save to both for redundancy and fallback
        try {
            await this.keychainStorage.save(this.currentProfile, state);
        } catch (e) {
            console.warn('Failed to save to keychain, falling back to file:', e);
        }
        await this.fileStorage.save(this.currentProfile, state);
    }

    async loadSession(): Promise<AuthState | null> {
        // Try keychain first
        try {
            const state = await this.keychainStorage.load(this.currentProfile);
            if (state) return state;
        } catch (e) {
            // Silently fall back
        }

        // Try file storage
        return await this.fileStorage.load(this.currentProfile);
    }

    async clearSession(): Promise<void> {
        try {
            await this.keychainStorage.clear(this.currentProfile);
        } catch (e) {}
        await this.fileStorage.clear(this.currentProfile);
    }

    setProfile(profile: string) {
        this.currentProfile = profile;
    }
}

export const sessionStorage = new MultiLayerStorage();
export type { AuthState };
