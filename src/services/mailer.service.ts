import { createMimeMessage } from "mimetext";
import { EmailMessage } from "cloudflare:email";
import PostalMime from "postal-mime";

interface SendEmailProps {
    to: string;
    from: string;
    subject: string;
    body: string;
}

interface EmailService {
    sendEmail(props: SendEmailProps): Promise<EmailSendResult>;
    replyToEmail(originalMessage: ForwardableEmailMessage, replyContent: string): Promise<EmailSendResult>;
}

/**
 * MailerService is responsible for sending emails using the provided email binding. It implements the EmailService interface, allowing it to send new emails and reply to existing ones. The service constructs MIME messages based on the input properties and uses the email binding to send them.
 * The sendEmail method takes an object containing the recipient's address, sender's address, email subject, and email body, constructs a MIME message, and sends it. The replyToEmail method takes an original email message and reply content, parses the original email to extract the subject, and sends a reply using the same email binding.
 * This service abstracts the email sending logic, making it easier to manage and test email-related functionality in the application.
 */
export class MailerService implements EmailService {
    constructor(private emailBinding: Env["EMAIL"]) {}
    
    /**
     * Sends an email using the provided email binding. It constructs a MIME message based on the input properties and sends it to the specified recipient.
     * @param props An object containing the necessary properties to send an email: the recipient's address (`to`), the sender's address (`from`), the email subject, and the email body. The method constructs a MIME email message using these properties and sends it using the provided email binding.
     * @returns A promise that resolves to the result of the email sending operation. The method uses the `createMimeMessage` function from the `mimetext` library to create a MIME message, sets the sender, recipient, subject, and body, and then sends it using the `send` method of the email binding.
     */
    async sendEmail(props: SendEmailProps): Promise<EmailSendResult> {
        const { to, from, subject, body } = props;
        const email = createMimeMessage();

        email.setSender(from);
        email.setRecipient(to);
        email.setSubject(subject);
        email.addMessage({ contentType: "text/plain", data: body });

        return this.emailBinding.send(
            new EmailMessage(
                from, 
                to, 
                email.asRaw()
            )
        );
    }

    /**
     * Helper method to reply to an email message. It parses the original email to extract the subject and sets up a reply with the provided content.
     * @param originalMessage The original email message to which we want to reply. It should contain the raw email data and the sender's address.
     * @param replyContent The content of the reply email. This will be sent as plain text.
     * @returns A promise that resolves to the result of the email sending operation. It uses the same email binding as the sendEmail method to send the reply.
     */
    async replyToEmail(originalMessage: ForwardableEmailMessage, replyContent: string): Promise<EmailSendResult> {
        const parser = new PostalMime();
        const email = await parser.parse(originalMessage.raw);
        const replyEmail = createMimeMessage();
        
        replyEmail.setSender("team@proyectograndorder.es"); // Set your sender email here
        replyEmail.setRecipient(originalMessage.from);
        replyEmail.setSubject("Re: " + email.subject);
        replyEmail.addMessage({ contentType: "text/plain", data: replyContent });

        return this.emailBinding.send(
            new EmailMessage(
                originalMessage.to, 
                originalMessage.from,
                replyEmail.asRaw()
            )
        );
    }
}