import React from 'react';
import { Box, Text } from 'ink';
import { formatPath } from '../utils/formatters.ts';
import { APP_CONFIG } from '../../config/constants.ts';

interface HeaderProps {
    isLoggedIn: boolean;
    user: string;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn, user }) => {
    const compressed = formatPath(process.cwd());

    return (
        <Box borderStyle="round" borderColor={APP_CONFIG.THEME.PRIMARY} paddingX={1}>
            <Box position="absolute" marginTop={-1} marginLeft={1} backgroundColor="black">
                <Text color={APP_CONFIG.THEME.PRIMARY}> {APP_CONFIG.NAME} {APP_CONFIG.VERSION} </Text>
            </Box>

            <Box flexDirection="row" width="100%" paddingTop={1} paddingBottom={1}>
                <Box flexDirection="column" alignItems="center" flexGrow={3} flexBasis={0}>
                    <Text bold>{isLoggedIn ? `Welcome back ${user}` : 'Welcome Guest'}</Text>
                    {!isLoggedIn && <Text color={APP_CONFIG.THEME.ERROR} dimColor>[ NOT AUTHENTICATED ]</Text>}
                    <Box marginY={1}>
                        <Text color={APP_CONFIG.THEME.SECONDARY}>
                            {`      *  ▐▛███▜▌ *
     * ▝▜█████▛▘ *
      *  ▘▘ ▝▝  *`}
                        </Text>
                    </Box>
                    <Box flexDirection="column" alignItems="center">
                        <Text dimColor>Model: {APP_CONFIG.DEFAULT_MODEL.split('/').pop()} (Reasoning)</Text>
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
