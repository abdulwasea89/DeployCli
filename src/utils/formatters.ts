import path from 'path';

export const formatPath = (cwd: string): string => {
    const segments = cwd.split(path.sep);
    return "..." + path.sep + segments.slice(-2).join(path.sep);
};

export const formatTimestamp = (): string => {
    return new Date().toLocaleTimeString();
};
