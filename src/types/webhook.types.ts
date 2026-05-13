import type { DiscordEmbed } from './embed.types';


export type AllowedMentionType = 'roles' | 'users' | 'everyone';

export interface AllowedMentions {
    parse?: AllowedMentionType[];
    roles?: string[];
    users?: string[];
    replied_user?: boolean;
}

export const MessageFlags = {
    SUPPRESS_EMBEDS: 1 << 2,
    SUPPRESS_NOTIFICATIONS: 1 << 12,
} as const;

export interface WebhookPayload {
    content?: string;
    username?: string;
    avatar_url?: string;
    tts?: boolean;
    embeds?: DiscordEmbed[];
    allowed_mentions?: AllowedMentions;
    flags?: number;
    thread_name?: string;
}

export interface ExecuteWebhookOptions {
    wait?: boolean;
    thread_id?: string;
}

export interface WebhookConfig {
    url: string;
}