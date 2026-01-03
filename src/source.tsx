import React from 'react';
import { render, Box, Text } from 'ink';
import dotenv from 'dotenv';
import { useChat } from './hooks/useChat.ts';
import { Header } from './components/Header.tsx';
import { ChatHistory } from './components/ChatHistory.tsx';
import { ChatInput } from './components/ChatInput.tsx';

dotenv.config();

const Chatbot = () => {
    const { messages, isProcessing, isLoggedIn, user, sendMessage } = useChat();

    return (
        <Box flexDirection="column" padding={1} minHeight={10}>
            <Header isLoggedIn={isLoggedIn} user={user} />
            <ChatHistory messages={messages} isProcessing={isProcessing} />
            <ChatInput
                onSubmit={sendMessage}
                isLoggedIn={isLoggedIn}
                isProcessing={isProcessing}
            />
            <Box marginTop={1}>
                <Text dimColor>Press Ctrl+C to exit</Text>
            </Box>
        </Box>
    );
};

render(<Chatbot />);