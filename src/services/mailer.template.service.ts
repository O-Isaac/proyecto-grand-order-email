import { createMimeMessage } from "mimetext";
import { templates } from "@templates/index";
import { EmailMessage } from "cloudflare:email";
import { Email } from "postal-mime";

type TemplateVariables = Record<string, string>;

interface SendTemplateEmailProps {
    message: ForwardableEmailMessage;
    email: Email;
    subject: string;
    templateName: string;
    variables?: TemplateVariables;
}

export class TemplateMailerService {
    private loadTemplate(templateName: string): string {
        const template = templates[templateName];
        if (!template) {
            throw new Error(`Template "${templateName}" not found.`);
        }
        return template;
    }

    private interpolate(template: string, variables: TemplateVariables): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return key in variables ? variables[key] : match;
        });
    }

    async sendTemplateEmail(props: SendTemplateEmailProps): Promise<void> {
        const { message, subject, templateName, email, variables = {} } = props;

        const rawTemplate = this.loadTemplate(templateName);
        const htmlBody = this.interpolate(rawTemplate, variables);

        const mime = createMimeMessage();
        mime.setSender(message.to);
        mime.setRecipient(message.from);
        mime.setSubject(subject);
        mime.addMessage({ contentType: "text/html", data: htmlBody });

        if (email.messageId) {
            mime.setHeader("In-Reply-To", email.messageId);
            const refs = [email.references, email.messageId].filter(Boolean).join(" ");
            mime.setHeader("References", refs);
        }

        await message.reply(new EmailMessage(message.to, message.from, mime.asRaw()));
    }
}