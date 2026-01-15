export interface AuthState {
    sessionToken: string;
    userId: string;
    userName: string;
    userEmail: string;
    savedAt: string;
}

export interface IAuthStorage {
    save(profile: string, state: AuthState): Promise<void>;
    load(profile: string): Promise<AuthState | null>;
    clear(profile: string): Promise<void>;
}
