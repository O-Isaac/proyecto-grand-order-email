import { ExecuteWebhookOptions, WebhookConfig, WebhookPayload } from "@ty/webhook.types";

/**
 * Low-level HTTP client for the Discord webhook API.
 *
 * Single responsibility: execute HTTP requests against a webhook URL and
 * surface errors as typed exceptions. It knows nothing about payloads or
 * builders — those live in helpers/.
 */
export interface IDiscordHttpClient {
    /**
     * Execute a POST request to the webhook URL with the given body and query parameters. Returns the raw `Response` object from the fetch call. Throws an error if the response status is not OK.
     * @param body The request body to send, typically a payload built with {@link WebhookMessageBuilder}.
     * @param queryParams Optional query parameters to include in the request URL (e.g., wait, thread_id).
     * @param files Optional array of files to include in the message, each with a filename, content as an ArrayBuffer, and MIME type. If provided, the request will be sent as multipart/form-data; otherwise, it will be sent as application/json.
     * @returns A promise that resolves to the `Response` object from the fetch call. If `wait=true` is included in the query parameters, the response body will contain the created message object.
     */
    post<TBody>(
        body: TBody,
        queryParams?: Record<string, string>,
        files?: DiscordFile[],
    ): Promise<Response>;

    /**
     * Execute a PATCH request to edit a previously sent webhook message. Returns the raw `Response` object from the fetch call. Throws an error if the response status is not OK.
     * @param messageId The Discord snowflake ID of the message to edit.
     * @param body The request body containing the fields to update, typically a partial payload built with {@link WebhookMessageBuilder}.
     * @param queryParams Optional query parameters to include in the request URL (e.g., thread_id).
     */
    patch<TBody>(
        messageId: string,
        body: TBody,
        queryParams?: Record<string, string>,
    ): Promise<Response>;

    /**
     * Execute a DELETE request to delete a previously sent webhook message. Throws an error if the response status is not OK.
     * @param messageId The Discord snowflake ID of the message to delete.
     * @param queryParams Optional query parameters to include in the request URL (e.g., thread_id).
     * @returns A promise that resolves when the message has been successfully deleted. If the response status is not OK, the promise will be rejected with an error containing the status code and response body.
     */
    delete(
        messageId: string,
        queryParams?: Record<string, string>,
    ): Promise<void>;
}

export interface DiscordFile {
    filename: string;
    content: ArrayBuffer;
    mimeType: string;
}

export class DiscordHttpClient implements IDiscordHttpClient {
    constructor(private readonly webhookUrl: string) { }

    async post<TBody>(
        body: TBody,
        queryParams: Record<string, string> = {},
        files: DiscordFile[] = [],
    ): Promise<Response> {
        const url = this.buildUrl(queryParams);

        const init: RequestInit = files.length > 0
            ? this.buildMultipart(body, files)
            : {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            };

        const response = await fetch(url, init);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Discord API error ${response.status} ${response.statusText}: ${errorBody}`,
            );
        }

        return response;

    }

    async patch<TBody>(
        messageId: string,
        body: TBody,
        queryParams: Record<string, string> = {},
    ): Promise<Response> {
        const url = this.buildUrl({ ...queryParams }, `/messages/${messageId}`);

        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Discord API error ${response.status} ${response.statusText}: ${errorBody}`,
            );
        }

        return response;
    }

    async delete(
        messageId: string,
        queryParams: Record<string, string> = {},
    ): Promise<void> {
        const url = this.buildUrl(queryParams, `/messages/${messageId}`);

        const response = await fetch(url, { method: 'DELETE' });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Discord API error ${response.status} ${response.statusText}: ${errorBody}`,
            );
        }
    }

    private buildMultipart<TBody>(body: TBody, files: DiscordFile[]): RequestInit {
        const form = new FormData();

        form.append('payload_json', JSON.stringify(body));

        files.forEach((file, index) => {
            form.append(
                `files[${index}]`,
                new Blob([file.content], { type: file.mimeType }),
                file.filename,
            );
        });

        return { method: 'POST', body: form };
    }

    private buildUrl(
        queryParams: Record<string, string>,
        suffix = '',
    ): string {
        const base = `${this.webhookUrl}${suffix}`;
        const params = new URLSearchParams(queryParams);
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    }
}

/**
 * High-level service for sending messages to Discord via webhooks. It uses an instance of {@link IDiscordHttpClient} to execute HTTP requests and provides methods for sending, editing, and deleting webhook messages. The service abstracts away the details of constructing API requests and handling responses, allowing callers to work with higher-level concepts like payloads and builders.
 * The send method takes a {@link WebhookPayload} and optional execution options, builds the appropriate query parameters, and uses the HTTP client to send the message. The editMessage method allows updating an existing message by its ID, and the deleteMessage method allows removing a message by its ID. Both methods also support optional thread IDs for messages sent within threads.
 * This service is designed to be used in conjunction with helper classes like {@link WebhookMessageBuilder} and {@link EmbedBuilder} to construct message payloads in a fluent and type-safe manner before sending them to Discord.
 */
export interface IDiscordService {
    /**
     * Execute the webhook — send a message to the configured channel.
     *
     * @param payload  Message payload built with {@link WebhookMessageBuilder}.
     * @param options  Optional query-string parameters (wait, thread_id).
     * @returns The raw Discord API `Response`. If `options.wait` is `true` the
     *          body will contain the created message object.
     */
    send(payload: WebhookPayload, options?: ExecuteWebhookOptions): Promise<Response>;

    /**
     * Edit a previously sent webhook message.
     *
     * @param messageId Discord snowflake ID of the message to edit.
     * @param payload   Partial payload — only provided fields will be updated.
     * @param threadId  Optional thread snowflake when message is inside a thread.
     */
    editMessage(
        messageId: string,
        payload: Partial<WebhookPayload>,
        threadId?: string,
    ): Promise<Response>;

    /**
     * Delete a previously sent webhook message.
     *
     * @param messageId Discord snowflake ID of the message to delete.
     * @param threadId  Optional thread snowflake when message is inside a thread.
     */
    deleteMessage(messageId: string, threadId?: string): Promise<void>;
}

export class DiscordService implements IDiscordService {
    private readonly client: IDiscordHttpClient;

    constructor(config: WebhookConfig) {
        this.client = new DiscordHttpClient(config.url);
    }

    async send(
        payload: WebhookPayload,
        options: ExecuteWebhookOptions = {},
        files: DiscordFile[] = [],
    ): Promise<Response> {
        const queryParams = this.buildExecuteQueryParams(options);
        return this.client.post(payload, queryParams, files);
    }

    async editMessage(
        messageId: string,
        payload: Partial<WebhookPayload>,
        threadId?: string,
    ): Promise<Response> {
        const queryParams: Record<string, string> = {};
        if (threadId) queryParams.thread_id = threadId;
        return this.client.patch(messageId, payload, queryParams);
    }

    async deleteMessage(messageId: string, threadId?: string): Promise<void> {
        const queryParams: Record<string, string> = {};
        if (threadId) queryParams.thread_id = threadId;
        return this.client.delete(messageId, queryParams);
    }

    private buildExecuteQueryParams(
        options: ExecuteWebhookOptions,
    ): Record<string, string> {
        const params: Record<string, string> = {};
        if (options.wait !== undefined) params.wait = String(options.wait);
        if (options.thread_id) params.thread_id = options.thread_id;
        return params;
    }


}
