import { ChatToolbar } from '../modules/chat/components/ChatToolbar';
import { Composer } from '../modules/chat/components/Composer';
import { MessageList } from '../modules/chat/components/MessageList';
import { ToolsSidebar } from '../modules/chat/components/ToolsSidebar';
import { useChatController } from '../modules/chat/components/useChatController';

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
