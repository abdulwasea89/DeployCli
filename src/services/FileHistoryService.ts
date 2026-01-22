import * as fs from 'fs';
import * as nodePath from 'path';

interface Snapshot {
    path: string;
    content: string;
    timestamp: number;
}

export class FileHistoryService {
    private static instance: FileHistoryService;
    private undoStack: Snapshot[] = [];
    private redoStack: Snapshot[] = [];

    private constructor() {}

    public static getInstance(): FileHistoryService {
        if (!FileHistoryService.instance) {
            FileHistoryService.instance = new FileHistoryService();
        }
        return FileHistoryService.instance;
    }

    public push(path: string, content: string) {
        this.undoStack.push({ path, content, timestamp: Date.now() });
        this.redoStack = []; // Clear redo stack on new action
        
        // Keep stack size reasonable (e.g., 20)
        if (this.undoStack.length > 20) {
            this.undoStack.shift();
        }
    }

    public undo(): string | null {
        const snapshot = this.undoStack.pop();
        if (!snapshot) return null;

        // Save current state to redo stack
        const currentContent = fs.readFileSync(snapshot.path, 'utf-8');
        this.redoStack.push({ path: snapshot.path, content: currentContent, timestamp: Date.now() });

        fs.writeFileSync(snapshot.path, snapshot.content, 'utf-8');
        return snapshot.path;
    }

    public redo(): string | null {
        const snapshot = this.redoStack.pop();
        if (!snapshot) return null;

        // Save current state back to undo stack
        const currentContent = fs.readFileSync(snapshot.path, 'utf-8');
        this.undoStack.push({ path: snapshot.path, content: currentContent, timestamp: Date.now() });

        fs.writeFileSync(snapshot.path, snapshot.content, 'utf-8');
        return snapshot.path;
    }
}

export const fileHistoryService = FileHistoryService.getInstance();
