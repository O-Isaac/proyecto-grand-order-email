import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect, vi } from "vitest";
import worker from "../src/index";

describe("Email handler", () => {
	it("should ignore emails from disallowed domains", async () => {
		const ctx = createExecutionContext();
		const message: ForwardableEmailMessage = {
			from: "spammer@bad-domain.com",
			to: "receipt@good.com",
			raw: new ReadableStream<Uint8Array>(),
			headers: new Headers(),
			rawSize: 0,
			setReject: vi.fn(),
			forward: vi.fn(),
			reply: vi.fn(),
		}

		await worker.email(message, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(message.setReject).not.toHaveBeenCalled();
		expect(message.forward).not.toHaveBeenCalled();
		expect(message.reply).not.toHaveBeenCalled();
	});


	it("should process emails from allowed domains", async () => {
        const ctx = createExecutionContext();
        const sendSpy = vi.spyOn(env.EMAIL, "send").mockImplementation(async () => {
			return {} as any;
		})

        const message = {
            from: "proyectograndordersheets@gmail.com",
            to: "team@proyectograndorder.es",
            raw: new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode("Subject: Test\n"));
					controller.enqueue(new TextEncoder().encode("From: proyectograndordersheets@gmail.com\n"));
					controller.enqueue(new TextEncoder().encode("To: team@proyectograndorder.es\n"));
					controller.enqueue(new TextEncoder().encode("\n"));
					controller.enqueue(new TextEncoder().encode("This is a test email body.\n"));
                    controller.close();
                }
            }),
            headers: new Headers(),
            forward: () => Promise.resolve(),
            reply: () => Promise.resolve(),
            setReject: () => {}
        } as unknown as ForwardableEmailMessage;

        // 3. Set the environment variable for the test
        env.ALLOWED_EMAILS_DOMAINS = "hotmail.com,gmail.com,protonmail.com,proton.me";

        await worker.email(message, env, ctx);
        await waitOnExecutionContext(ctx);
    
        // 4. Assert against the spy
        expect(sendSpy).toHaveBeenCalled();
    });
});