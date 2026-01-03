import React, { useState } from 'react';
import { Box } from 'ink';
import TextInput from 'ink-text-input';

interface ChatInputProps {
    onSubmit: (value: string) => void;
    isLoggedIn: boolean;
    isProcessing: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoggedIn, isProcessing }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (value: string) => {
        setInput('');
        onSubmit(value);
    };

    return (
        <Box borderStyle="round" borderColor="dim" paddingX={1} marginTop={1}>
            <TextInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                placeholder={!isLoggedIn ? 'Type /login to start...' : (isProcessing ? 'Processing...' : 'Type a message...')}
            />
        </Box>
    );
};
