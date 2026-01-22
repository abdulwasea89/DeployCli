import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { Message } from "../types/chat.ts";
import { ToonService } from "../utils/ToonService.ts";

import { metrics } from "../services/metrics.ts";
import { APP_CONFIG } from "../../config/constants.ts";

interface ChatHistoryProps {
  messages: Message[];
  isProcessing: boolean;
}

const MessageFooter: React.FC = () => {
  const data = metrics.getRawData();
  const uptime = Math.floor((Date.now() - data.session.startTime) / 1000);

  return (
    <Box marginTop={0} flexDirection="row" gap={2}>
      {/* <Text color="grey">│ </Text>
            <Text dimColor color="grey">
                {uptime}s · {data.session.messagesSent + data.session.messagesReceived} turns
            </Text> */}
    </Box>
  );
};

const SmartResultRenderer: React.FC<{ result: any; isError: boolean }> = ({
  result,
  isError,
}) => {
  let data = result;

  // Try to parse if it's a stringified JSON array/object
  if (
    typeof result === "string" &&
    (result.startsWith("[") || result.startsWith("{"))
  ) {
    try {
      data = JSON.parse(result);
    } catch (e) {
      data = result;
    }
  }

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
    // Format as a compact TOON table
    const keys = Object.keys(data[0]).slice(0, 3);
    const header = `items[${data.length}]{${keys.join(",")}}`;
    const rows = data
      .slice(0, 5)
      .map((item: any) =>
        keys.map((key) => String(item[key]).slice(0, 20)).join(","),
      )
      .join("\n");
    const content = `${header}\n${rows}${data.length > 5 ? "\n..." : ""}`;

    return <Text color={isError ? "red" : "cyan"}>{content}</Text>;
  }

  const resultStr = typeof data === "string" ? data : ToonService.toToon(data);
  const preview =
    resultStr.length > 800 ? resultStr.slice(0, 797) + "..." : resultStr;
  return <Text color={isError ? "red" : "white"}>{preview}</Text>;
};
const MarkdownLite: React.FC<{ text: string; color?: string }> = ({
  text,
  color,
}) => {
  const lines = text.split("\n");
  return (
    <Box flexDirection="column">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Thinking prefix
        if (trimmed.startsWith("Thinking:")) {
          return (
            <Box key={i} marginBottom={0}>
              <Text italic dimColor color="yellow">
                {trimmed}
              </Text>
            </Box>
          );
        }

        // Handling User Request Header
        if (trimmed === "Handling User Request") {
          return (
            <Box key={i} marginTop={1} marginBottom={0}>
              <Text bold color="magenta">
                {trimmed}
              </Text>
            </Box>
          );
        }

        // Headers
        if (line.startsWith("# "))
          return (
            <Text key={i} bold color="magenta" underline>
              {line.slice(2).toUpperCase()}
            </Text>
          );
        if (line.startsWith("## "))
          return (
            <Text key={i} bold color="cyan">
              {line.slice(3)}
            </Text>
          );
        if (line.startsWith("### "))
          return (
            <Text key={i} bold color="yellow" italic>
              {line.slice(4)}
            </Text>
          );

        // Bullet points with better indentation
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <Box key={i} paddingLeft={2}>
              <Text color="grey"> - </Text>
              <Text color={color}>{trimmed.slice(2)}</Text>
            </Box>
          );
        }

        // Action Intent (Arrow)
        if (trimmed.startsWith("→")) {
          return (
            <Box key={i} paddingLeft={2} marginTop={1}>
              <Text color="cyan">→ </Text>
              <Text color="white" bold>
                {trimmed.slice(2)}
              </Text>
            </Box>
          );
        }

        // Bold text
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <Box key={i} flexDirection="row" flexWrap="wrap">
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <Text key={j} bold color="white">
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return (
                <Text key={j} color={color}>
                  {part}
                </Text>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  isProcessing,
}) => {
  return (
    <Box flexDirection="column" gap={0} marginTop={1} flexGrow={1}>
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        return (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Box>
              <Box marginRight={1} width={2}>
                <Text color={isUser ? "blue" : "magenta"} bold>
                  {isUser ? "❯" : ""}
                </Text>
              </Box>
              <Box flexDirection="column" flexGrow={1} flexShrink={1}>
                {/* Reasoning Block */}
                {msg.reasoning && (
                  <Box flexDirection="row">
                    <Text dimColor color="grey">
                      │__{" "}
                    </Text>
                    <Box flexDirection="column" paddingX={1} flexGrow={1}>
                      <MarkdownLite text={msg.reasoning} color="grey" />
                      <Text color="white">{""}</Text>
                    </Box>
                    <Text color="white">{""}</Text>
                    <Text color="white">{""}</Text>
                  </Box>
                )}

                {/* Content Block */}
                {msg.content && (
                  <Box>
                    {!isUser && (
                      <Text dimColor color="grey">
                        {" "}
                      </Text>
                    )}
                    <Box marginX={!isUser ? 1 : 0} flexGrow={1}>
                      {isUser ? (
                        <Text color="white">{""}</Text>
                      ) : (
                        <>
                          <MarkdownLite text={msg.content} />
                        </>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Tool Calls */}
                {/* {msg.toolCalls?.map((tc, j) => (
                                    <Box key={`tc-${j}`} flexDirection="row" marginTop={1}>
    
                                        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} marginX={1}>
                                            <Box gap={1}>
                                                <Text color="cyan" bold inverse>Tool Call</Text>
                                                <Text color="white" bold underline>{tc.toolName}</Text>
                                            </Box>
                                            <Box>
                                                <Text dimColor color="grey">
                                                    {Object.entries(tc.args).map(([k,v]) => `${k}=${v}`).join(' ')}
                                                </Text>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))} */}

                {/* Tool Results */}
                {msg.role === "tool" &&
                  msg.toolResults?.map((tr, k) => {
                    const resultStr =
                      typeof tr.result === "string"
                        ? tr.result
                        : JSON.stringify(tr.result);
                    const isError =
                      resultStr.toUpperCase().includes("ERROR") ||
                      resultStr.startsWith("❌");

                    return (
                      <Box key={`tr-${k}`} flexDirection="row" marginTop={1}>
                        <Text color="grey">│ </Text>
                        <Box flexDirection="column" marginX={1} flexGrow={1}>
                          <Box gap={1} paddingX={1} marginBottom={0}>
                            <Text
                              color={isError ? "red" : "green"}
                              bold
                              inverse
                            >
                              {" "}
                              {isError ? "FAILED" : "SUCCESS"}{" "}
                            </Text>
                            <Text dimColor color="grey">
                              {tr.toolName}
                            </Text>
                          </Box>
                          <Box
                            borderStyle="round"
                            borderColor={isError ? "red" : "dim"}
                            paddingX={1}
                            backgroundColor="#1A1A1A"
                          >
                            <SmartResultRenderer
                              result={tr.result}
                              isError={isError}
                            />
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}

                {!isUser &&
                  !msg.reasoning &&
                  !msg.content &&
                  msg.role !== "tool" &&
                  (!msg.toolCalls || msg.toolCalls.length === 0) && (
                    <Box flexDirection="row">
                      <Text dimColor italic color="grey">
                        {" "}
                        Waiting for response...
                      </Text>
                    </Box>
                  )}

                {/* Message Footer Metrics */}
                {!isUser && msg.role === "assistant" && <MessageFooter />}
              </Box>
            </Box>
          </Box>
        );
      })}

      {isProcessing && (
        <Box gap={1} marginTop={1} paddingLeft={3}>
          <Text color="yellow">
            <Spinner type="dots" />{" "}
            <Text italic dimColor>
              Agent is thinking...
            </Text>
          </Text>
        </Box>
      )}
    </Box>
  );
};
