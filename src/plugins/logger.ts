export interface Plugin {
    name: string;
    execute: (args: string[]) => void;
}

export const LoggerPlugin: Plugin = {
    name: 'logger',
    execute: (args) => {
        console.log(`[Plugin: Logger] Executing with args: ${args.join(', ')}`);
    }
};
