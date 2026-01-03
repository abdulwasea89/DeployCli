import React from 'react';
import { Box, Text } from 'ink';
import path from 'path';

interface HeaderProps {
    isLoggedIn: boolean;
    user: string;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn, user }) => {
    const cwd = process.cwd();
    const segments = cwd.split(path.sep);
    const compressed = "..." + path.sep + segments.slice(-2).join(path.sep);

    return (
        <Box borderStyle="round" borderColor="#d97706" paddingX={1}>
            <Box position="absolute" marginTop={-1} marginLeft={1} backgroundColor="black">
                <Text color="#d97706"> DEPLOY CLI 0.1.0 </Text>
            </Box>

            <Box flexDirection="row" width="100%" paddingTop={1} paddingBottom={1}>
                <Box flexDirection="column" alignItems="center" flexGrow={3} flexBasis={0}>
                    <Text bold>{isLoggedIn ? `Welcome back ${user}` : 'Welcome Guest'}</Text>
                    {!isLoggedIn && <Text color="red" dimColor>[ NOT AUTHENTICATED ]</Text>}
                    <Box marginY={1}>
                        <Text color="cyan">
                            {`      *  ▐▛███▜▌ *
     * ▝▜█████▛▘ *
      *  ▘▘ ▝▝  *`}
                        </Text>
                    </Box>
                    <Box flexDirection="column" alignItems="center">
                        <Text dimColor>Model: GPT-OSS-120b (Reasoning)</Text>
                        <Text dimColor>{compressed}</Text>
                    </Box>
                </Box>
                <Box borderStyle="single" borderLeft={true} borderRight={false} borderTop={false} borderBottom={false} borderColor="dim" paddingX={1} />
                <Box flexDirection="column" flexGrow={2} flexBasis={0} paddingLeft={1}>
                    <Text color="yellow">Status</Text>
                    <Text>{isLoggedIn ? "✅ Authenticated" : "❌ Locked"}</Text>
                    <Box borderStyle="single" borderTop={true} borderLeft={false} borderRight={false} borderBottom={false} borderColor="dim" marginY={1} />
                    <Text color="yellow">Recent activity</Text>
                    <Text>No recent activity</Text>
                </Box>
            </Box>
        </Box>
    );
};
