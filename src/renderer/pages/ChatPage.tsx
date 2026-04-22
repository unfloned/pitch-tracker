import { ChatToolbar } from '../components/chat/ChatToolbar';
import { Composer } from '../components/chat/Composer';
import { MessageList } from '../components/chat/MessageList';
import { ToolsSidebar } from '../components/chat/ToolsSidebar';
import { useChatController } from '../components/chat/useChatController';

/**
 * Chat assistant page. Thin container composing toolbar, tools sidebar,
 * scrollable thread, and composer. All state lives in useChatController.
 */
export function ChatPage() {
    const {
        messages,
        input,
        setInput,
        sending,
        error,
        ollamaRunning,
        scrollRef,
        threadStart,
        send,
        clear,
    } = useChatController();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <ChatToolbar
                threadStart={threadStart}
                ollamaRunning={ollamaRunning}
                hasMessages={messages.length > 0}
                onClear={clear}
            />

            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <ToolsSidebar
                    messages={messages}
                    ollamaRunning={ollamaRunning}
                    threadStart={threadStart}
                />

                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <MessageList
                        ref={scrollRef}
                        messages={messages}
                        sending={sending}
                        error={error}
                        threadStart={threadStart}
                        onPickSuggestion={(p) => send(p)}
                    />
                    <Composer
                        value={input}
                        disabled={sending}
                        onChange={setInput}
                        onSubmit={() => send()}
                    />
                </div>
            </div>
        </div>
    );
}
