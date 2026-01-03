import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { Message } from '../types/chat.ts';

interface ChatHistoryProps {
    messages: Message[];
    isProcessing: boolean;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isProcessing }) => {
    return (
        <Box flexDirection="column" gap={1} marginTop={1} flexGrow={1}>
            {messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                    <Box key={i} flexDirection="column">
                        <Box>
                            <Box marginRight={1}>
                                <Text color={isUser ? "blue" : "magenta"} bold>{isUser ? "❯" : "✧"}</Text>
                            </Box>
                            <Box flexDirection="column" flexShrink={1}>
                                {/* Reasoning Block */}
                                {msg.reasoning && (
                                    <Box paddingLeft={2} marginBottom={msg.content ? 1 : 0}>
                                        <Box flexDirection="column">
                                            <Text dimColor>|_ </Text>
                                            <Box paddingLeft={3}>
                                                <Text dimColor italic color="grey">
                                                    {msg.reasoning}
                                                </Text>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                                {/* Content Block */}
                                {msg.content ? (
                                    <Text color={isUser ? "white" : undefined}>{msg.content}</Text>
                                ) : (!isUser && !msg.reasoning && (
                                    <Text dimColor italic>Waiting for response...</Text>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                );
            })}

            {isProcessing && (
                <Box gap={1}>
                    <Text color="magenta">✧</Text>
                    <Text color="yellow">
                        <Spinner type="dots" /> AI is reasoning...
                    </Text>
                </Box>
            )}
        </Box>
    );
};
