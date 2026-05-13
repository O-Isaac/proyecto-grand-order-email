import { toArrayBuffer } from "@helpers/buffer.helper";
import { EmbedBuilder } from "@helpers/embed.builder";
import { WebhookMessageBuilder } from "@helpers/message.builder";
import { AIService } from "@services/ai.services";
import { AuthService } from "@services/auth.service"
import { DiscordFile, DiscordService } from "@services/discord.service";
import { TemplateMailerService } from "@services/mailer.template.service";
import PostalMime from "postal-mime";

export default {
	async email(message, env, ctx) {
		// Phase 1: Parse the email
		const parser = new PostalMime();
		const email = await parser.parse(message.raw);

		console.log(`From: ${email.from?.address || "Unknown sender"}`);
		console.log(`Subject: ${email.subject}`);
		console.log(`Body: ${email.text}`);

		// Phase 2: Send to Discord webhook
		const imageAttachments = (email.attachments ?? []).filter(a =>
			a.mimeType?.startsWith("image/")
		);

		const embed = new EmbedBuilder()
			.setTitle("Nuevo correo recibido")
			.addField("De", email.from?.address || "Desconocido")
			.addField("Asunto", email.subject || "Sin asunto")
			.setTimestamp()
			.build();

		const payload = new WebhookMessageBuilder()
			.setAvatarUrl("https://www.proyectograndorder.es/favicon/apple-icon-57x57.png")
			.setUsername("team@proyectograndorder.es")
			.setContent(
				email.text ? `>>> ${email.text.replaceAll(">", "").trimEnd()}` : ""
			)
			.addEmbed(embed)
			.build();

		const discordFiles: DiscordFile[] = imageAttachments.map((attachment, index) => ({
			content: toArrayBuffer(attachment.content),
			filename: attachment.filename || `attachment-${index}`,
			mimeType: attachment.mimeType || "application/octet-stream",
		}));

		const discord = new DiscordService({ url: env.DISCORD_WEBHOOK_URL });

		try {
			await discord.send(payload, {}, discordFiles);
			console.log("Mensaje enviado a Discord con éxito.");
		} catch (error) {
			console.error("Error al enviar mensaje a Discord:", error);
		}

		// Phase 3: Check if sender is allowed
		if (!AuthService.isDomainAllowed(message.from, env.ALLOWED_EMAILS_DOMAINS)) {
			console.warn(`Not allowed, skipping AI response: ${message.from}`);
			return;
		}

		// Phase 4: Generate AI reply
		const isReply = !!email.inReplyTo || (email.subject?.toLowerCase().startsWith("re:") ?? false);
		const templateName = isReply ? "reply-received" : "reply";

		const ai = new AIService(env.AI);
		const aiReply = await ai.generateReply(
			email.text || "",
			imageAttachments.map((a) => ({
				content: toArrayBuffer(a.content),
				mimeType: a.mimeType || "image/jpeg",
			}))
		);

		// Phase 5: Send email reply
		const mailerTemplateService = new TemplateMailerService();

		await mailerTemplateService.sendTemplateEmail({
			message,
			email,
			subject: `Re: ${email.subject || "Tu consulta"}`,
			templateName,
			variables: {
				subject: email.subject || "Tu consulta",
				sent_date: new Date().toLocaleString(),
				user_name: email.from?.name || email.from?.address || "Usuario",
				message_body: aiReply,
				response_time: "unos segundos",
			},
		});
	},

	async fetch(request, env, ctx): Promise<Response> {
		return new Response("Hello World!");
	},
} satisfies ExportedHandler<Env>;