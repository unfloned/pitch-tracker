import Store from 'electron-store';
import type { AgentConfig } from './types';

const profileStore = new Store<AgentConfig>({
    name: 'agent-profile',
    defaults: {
        stackKeywords: 'TypeScript, Next.js, React, Node.js, React Native, Postgres',
        remotePreferred: true,
        minSalary: 60000,
        antiStack: 'Java-only, C#-only, PHP-only, Vue-only, Angular-only',
        autoImportThreshold: 0,
    },
});

export function getAgentProfile(): AgentConfig {
    return {
        stackKeywords: profileStore.get('stackKeywords'),
        remotePreferred: profileStore.get('remotePreferred'),
        minSalary: profileStore.get('minSalary'),
        antiStack: profileStore.get('antiStack'),
        autoImportThreshold: profileStore.get('autoImportThreshold') ?? 0,
    };
}

export function setAgentProfile(profile: Partial<AgentConfig>): AgentConfig {
    for (const [key, value] of Object.entries(profile)) {
        if (value === undefined) continue;
        const k = key as keyof AgentConfig;
        profileStore.set(k, value as AgentConfig[typeof k]);
    }
    return getAgentProfile();
}
