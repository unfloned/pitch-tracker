import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Group,
    Paper,
    ScrollArea,
    Stack,
    Text,
    Textarea,
    Title,
    Tooltip,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconMessageCircle,
    IconSend,
    IconSparkles,
    IconTool,
    IconTrash,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    toolsUsed?: string[];
}

const SUGGESTIONS_KEYS = [
    'chat.suggestion1',
    'chat.suggestion2',
    'chat.suggestion3',
    'chat.suggestion4',
];

export function ChatPage() {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, sending]);

    const send = async (text?: string) => {
        const prompt = (text ?? input).trim();
        if (!prompt || sending) return;
        setError(null);
        setInput('');
        const next: Message[] = [...messages, { role: 'user', content: prompt }];
        setMessages(next);
        setSending(true);

        const history = next.map((m) => ({ role: m.role, content: m.content }));
        const result = await window.api.chat.send({ messages: history });
        setSending(false);

        if (result.error) {
            setError(result.error);
            return;
        }
        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: result.reply,
                toolsUsed: result.toolsUsed,
            },
        ]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const clear = () => {
        setMessages([]);
        setError(null);
    };

    return (
        <Stack gap="md" h="calc(100vh - 120px)">
            <Group justify="space-between">
                <Group gap="xs">
                    <IconMessageCircle size={22} />
                    <Title order={2}>{t('chat.title')}</Title>
                </Group>
                {messages.length > 0 && (
                    <Tooltip label={t('chat.clear')}>
                        <ActionIcon variant="subtle" color="red" onClick={clear}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                )}
            </Group>

            <Alert variant="light" color="accent" icon={<IconSparkles size={16} />}>
                {t('chat.hint')}
            </Alert>

            <ScrollArea flex={1} viewportRef={scrollRef}>
                <Stack gap="md" pr="md">
                    {messages.length === 0 && (
                        <Paper withBorder p="md" radius="md">
                            <Text size="sm" fw={600} mb="xs">
                                {t('chat.suggestionsTitle')}
                            </Text>
                            <Stack gap="xs">
                                {SUGGESTIONS_KEYS.map((key) => (
                                    <Button
                                        key={key}
                                        variant="light"
                                        justify="start"
                                        onClick={() => send(t(key))}
                                    >
                                        {t(key)}
                                    </Button>
                                ))}
                            </Stack>
                        </Paper>
                    )}

                    {messages.map((msg, idx) => (
                        <Paper
                            key={idx}
                            withBorder
                            p="md"
                            radius="md"
                            style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                backgroundColor:
                                    msg.role === 'user'
                                        ? 'light-dark(var(--mantine-color-accent-0), rgba(87, 130, 255, 0.1))'
                                        : undefined,
                            }}
                        >
                            {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                                <Group gap={4} mb="xs">
                                    {msg.toolsUsed.map((name, i) => (
                                        <Badge
                                            key={i}
                                            size="xs"
                                            variant="light"
                                            color="gray"
                                            leftSection={<IconTool size={10} />}
                                        >
                                            {name}
                                        </Badge>
                                    ))}
                                </Group>
                            )}
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                {msg.content}
                            </Text>
                        </Paper>
                    ))}

                    {sending && (
                        <Paper
                            withBorder
                            p="md"
                            radius="md"
                            style={{ alignSelf: 'flex-start', maxWidth: '85%' }}
                        >
                            <Text size="sm" c="dimmed">
                                {t('chat.thinking')}
                            </Text>
                        </Paper>
                    )}

                    {error && (
                        <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />}>
                            {error}
                        </Alert>
                    )}
                </Stack>
            </ScrollArea>

            <Box>
                <Group align="flex-end" gap="xs">
                    <Textarea
                        flex={1}
                        placeholder={t('chat.placeholder')}
                        autosize
                        minRows={1}
                        maxRows={6}
                        value={input}
                        onChange={(e) => setInput(e.currentTarget.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                    />
                    <Button
                        leftSection={<IconSend size={16} />}
                        onClick={() => send()}
                        loading={sending}
                        disabled={!input.trim()}
                    >
                        {t('chat.send')}
                    </Button>
                </Group>
                <Text size="xs" c="dimmed" mt={4}>
                    {t('chat.submitHint')}
                </Text>
            </Box>
        </Stack>
    );
}
