import { AllowedMentions, WebhookPayload } from "@ty/webhook.types"
import { DiscordEmbed } from "@ty/embed.types"

/**
 * Fluent builder for Discord Webhook message payloads.
 *
 * @example
 * const payload = new WebhookMessageBuilder()
 *   .setContent('Hello from the bot!')
 *   .setUsername('Notifier')
 *   .addEmbed(embed)
 *   .build();
 */
export class WebhookMessageBuilder {
    private readonly payload: WebhookPayload = {};

    setContent(content: string): this {
        if (content.length > 2000) {
            throw new RangeError('Message content must not exceed 2000 characters.');
        }
        this.payload.content = content;
        return this;
    }

    setUsername(username: string): this {
        this.payload.username = username;
        return this;
    }

    setAvatarUrl(avatarUrl: string): this {
        this.payload.avatar_url = avatarUrl;
        return this;
    }

    setTts(tts: boolean): this {
        this.payload.tts = tts;
        return this;
    }

    setFlags(flags: number): this {
        this.payload.flags = flags;
        return this;
    }

    setThreadName(threadName: string): this {
        this.payload.thread_name = threadName;
        return this;
    }

    addEmbed(embed: DiscordEmbed): this {
        if (!this.payload.embeds) this.payload.embeds = [];

        if (this.payload.embeds.length >= 10) {
            throw new RangeError('A webhook message cannot contain more than 10 embeds.');
        }

        this.payload.embeds.push(embed);
        return this;
    }

    addEmbeds(...embeds: DiscordEmbed[]): this {
        for (const embed of embeds) {
            this.addEmbed(embed);
        }
        return this;
    }

    setAllowedMentions(allowedMentions: AllowedMentions): this {
        this.payload.allowed_mentions = allowedMentions;
        return this;
    }

    suppressMentions(): this {
        this.payload.allowed_mentions = { parse: [] };
        return this;
    }

    private validate(): void {
        const { content, embeds } = this.payload;
        const hasContent = content !== undefined && content.trim().length > 0;
        const hasEmbeds = embeds !== undefined && embeds.length > 0;

        if (!hasContent && !hasEmbeds) {
            throw new Error(
                'A webhook message must have at least one of: content, embeds.',
            );
        }
    }

    build(): WebhookPayload {
        this.validate();
        return { ...this.payload };
    }
}
