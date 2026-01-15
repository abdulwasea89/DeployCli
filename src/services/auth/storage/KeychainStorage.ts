import keytar from 'keytar';
import { AuthState, IAuthStorage } from './types.ts';

export class KeychainStorage implements IAuthStorage {
    private service = 'deploy-cli';

    async save(profile: string, state: AuthState): Promise<void> {
        await keytar.setPassword(this.service, profile, JSON.stringify(state));
    }

    async load(profile: string): Promise<AuthState | null> {
        const data = await keytar.getPassword(this.service, profile);
        if (!data) return null;
        try {
            return JSON.parse(data) as AuthState;
        } catch {
            return null;
        }
    }

    async clear(profile: string): Promise<void> {
        await keytar.deletePassword(this.service, profile);
    }
}
