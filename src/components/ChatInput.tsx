import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import fs from 'fs';
import path from 'path';

interface ChatInputProps {
    onSubmit: (value: string) => void;
    isLoggedIn: boolean;
    isProcessing: boolean;
}

const COMMANDS = [
    { label: '/help', description: 'Show available commands' },
    { label: '/login', description: 'Sign in to your account' },
    { label: '/clear', description: 'Clear chat history' },
    { label: '/history', description: 'View past conversations' },
    { label: '/model', description: 'Switch AI model' },
    { label: '/exit', description: 'Exit the application' },
];

export const ChatInput: React.FC<ChatInputProps> = React.memo(({ onSubmit, isLoggedIn, isProcessing }) => {
    const [input, setInput] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [files, setFiles] = useState<string[]>([]);

    // Command handling
    const showCommandDropdown = useMemo(() => input.startsWith('/') && !input.includes(' '), [input]);
    const filteredCommands = useMemo(() => showCommandDropdown
        ? COMMANDS.filter(cmd => cmd.label.startsWith(input))
        : [], [showCommandDropdown, input]);

    // File handling
    const atTokenMatch = useMemo(() => input.match(/@(\S*)$/), [input]);
    const showFileDropdown = !!atTokenMatch;
    const currentFileFilter = useMemo(() => atTokenMatch ? atTokenMatch[1] : '', [atTokenMatch]);

    const filteredFiles = useMemo(() => showFileDropdown
        ? files.filter(f => f.toLowerCase().startsWith(currentFileFilter.toLowerCase()))
        : [], [showFileDropdown, files, currentFileFilter]);

    // Prioritize file dropdown if active, otherwise command dropdown
    const isDropdownVisible = (showCommandDropdown && filteredCommands.length > 0) || (showFileDropdown && filteredFiles.length > 0);

    // Determine which list to use for navigation
    const activeList = showFileDropdown ? filteredFiles : filteredCommands;
    const activeListLength = activeList.length;

    useEffect(() => {
        if (showFileDropdown) {
            try {
                const allFiles = fs.readdirSync(process.cwd());
                // Add directories with trailing slash
                const formattedFiles = allFiles.map(f => {
                    try {
                        const stat = fs.statSync(path.join(process.cwd(), f));
                        return stat.isDirectory() ? f + '/' : f;
                    } catch {
                        return f;
                    }
                });
                setFiles(formattedFiles);
            } catch (e) {
                setFiles([]);
            }
        }
    }, [showFileDropdown]);

    useInput((_input, key) => {
        if (isDropdownVisible && activeListLength > 0) {
            if (key.downArrow) {
                setSelectedIndex((prev) => (prev + 1) % activeListLength);
            }
            if (key.upArrow) {
                setSelectedIndex((prev) => (prev - 1 + activeListLength) % activeListLength);
            }
            if (key.tab) {
                completeSelection();
            }
        }
    });

    const completeSelection = () => {
        if (showFileDropdown && filteredFiles[selectedIndex]) {
            const selectedFile = filteredFiles[selectedIndex];
            // Replace the @token with the selected file
            const newInput = input.replace(/@(\S*)$/, '@' + selectedFile + ' ');
            setInput(newInput);
            setSelectedIndex(0);
            return;
        }

        if (showCommandDropdown && filteredCommands[selectedIndex]) {
            const selectedCommand = filteredCommands[selectedIndex];
            setInput(selectedCommand.label + ' ');
            setSelectedIndex(0);
        }
    };

    // Reset selection when input changes or filtered list changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [input, showFileDropdown, showCommandDropdown]);

    const handleSubmit = (value: string) => {
        if (isDropdownVisible && activeListLength > 0) {
            const selectedItem = activeList[selectedIndex];
            if (selectedItem) {
                completeSelection();
                return;
            }
        }
        setInput('');
        onSubmit(value);
    };

    // Ghost text calculation
    const currentSuggestion = activeList[selectedIndex];
    const ghostText = useMemo(() => (isDropdownVisible && currentSuggestion)
        ? (typeof currentSuggestion === 'string'
            ? currentSuggestion.slice(currentFileFilter.length)
            : currentSuggestion.label.slice(input.length))
        : '', [isDropdownVisible, currentSuggestion, currentFileFilter, input]);

    // Long text summary logic
    const lines = input.split('\n');
    const lineCount = lines.length;
    const isLongText = (lineCount > 3 || input.length > 200) && input.trim().length > 0;
    const previewText = useMemo(() => {
        if (!isLongText) return '';
        const clean = input.trim().replace(/\s+/g, ' ');
        return clean.length > 30 ? clean.slice(0, 27) + '...' : clean;
    }, [input, isLongText]);

    return (
        <Box flexDirection="column" marginTop={1}>
            {isDropdownVisible && (
                <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={0}>
                    {/* Render Header */}
                    <Box marginBottom={1} borderStyle="single" borderBottom borderColor="dim">
                        <Text bold color="cyan">
                            {showFileDropdown ? ' 🔍 FILE SELECTOR ' : ' ⚡ COMMANDS '}
                        </Text>
                    </Box>

                    {/* Render Commands */}
                    {showCommandDropdown && filteredCommands.map((cmd, index) => (
                        <Box key={cmd.label}>
                            <Text color={index === selectedIndex ? 'yellow' : 'white'}>
                                {index === selectedIndex ? '❯ ' : '  '}
                                <Text bold={index === selectedIndex}>{cmd.label}</Text>
                                <Text dimColor> - {cmd.description}</Text>
                            </Text>
                        </Box>
                    ))}

                    {/* Render Files */}
                    {showFileDropdown && filteredFiles.slice(0, 10).map((file, index) => (
                        <Box key={file}>
                            <Text color={index === selectedIndex ? 'yellow' : 'white'}>
                                {index === selectedIndex ? '❯ ' : '  '}
                                <Text>{file.endsWith('/') ? '📁 ' : '📄 '}</Text>
                                <Text bold={index === selectedIndex}>{file}</Text>
                            </Text>
                        </Box>
                    ))}

                    {/* Render Footer/Hints */}
                    <Box marginTop={1} paddingTop={0} borderStyle="single" borderTop borderColor="dim">
                        <Text dimColor italic>
                            {' '}↑↓ navigate • Tab/Enter select • Esc close{' '}
                        </Text>
                    </Box>
                </Box>
            )}
            <Box borderStyle="round" borderColor={isProcessing ? 'dim' : 'cyan'} paddingX={1}>
                {isLongText ? (
                    <Box flexGrow={1} justifyContent="space-between">
                        <Box flexShrink={1}>
                            <Text color="cyan" bold>📝 {lineCount} lines</Text>
                            <Text dimColor italic> "{previewText}"</Text>
                        </Box>
                        <Box>
                            <Text dimColor>[Enter to send • Backspace to edit]</Text>
                        </Box>
                        {/* Hidden input to keep state synced */}
                        <Box height={0} width={0} overflow="hidden">
                            <TextInput
                                value={input}
                                onChange={setInput}
                                onSubmit={handleSubmit}
                            />
                        </Box>
                    </Box>
                ) : (
                    <Box flexGrow={1}>
                        <TextInput
                            value={input}
                            onChange={setInput}
                            onSubmit={handleSubmit}
                            showCursor={!isProcessing}
                            placeholder={!isLoggedIn ? 'Type /login to start...' : (isProcessing ? 'Processing...' : 'Type a message...')}
                        />
                        {ghostText && (
                            <Text dimColor>{ghostText}</Text>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
});
