export interface Message {
    role: 'user' | 'assistant';
    content: string;
    /** Tool IDs the assistant called when producing this reply. */
    toolsUsed?: string[];
    timestamp: Date;
}
