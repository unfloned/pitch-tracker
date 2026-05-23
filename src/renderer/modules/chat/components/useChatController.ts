import { useEffect, useRef, useState } from 'react';
import type { Message } from './types';

/**
 * State + side-effects for the chat thread. Holds the messages, typing state,
 * Ollama status poll, and exposes `send` / `clear`. Keeps ChatPage as a pure
 * composition of the sub-components.
 */
export function useChatController() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const threadStart = useRef(new Date());

    // Auto-scroll on new content.
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, sending]);

    // Poll Ollama status once a minute.
    useEffect(() => {
        const check = async () => {
            try {
                const s = await window.api.llm.status();
                setOllamaRunning(s.running);
            } catch {
                setOllamaRunning(false);
            }
        };
        check();
        const i = setInterval(check, 30000);
        return () => clearInterval(i);
    }, []);

    const send = async (text?: string) => {
        const prompt = (text ?? input).trim();
        if (!prompt || sending) return;
        setError(null);
        setInput('');

        const next: Message[] = [
            ...messages,
            { role: 'user', content: prompt, timestamp: new Date() },
        ];
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
                timestamp: new Date(),
            },
        ]);
    };

    const clear = () => {
        setMessages([]);
        setError(null);
        threadStart.current = new Date();
    };

    return {
        messages,
        input,
        setInput,
        sending,
        error,
        ollamaRunning,
        scrollRef,
        threadStart: threadStart.current,
        send,
        clear,
    };
}
