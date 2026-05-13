import reply from "@templates/email/reply.html";
import replyReceived from "@templates/email/reply-received.html";

export const templates: Record<string, string> = {
    "reply": reply,
    "reply-received": replyReceived
};