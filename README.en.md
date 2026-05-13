🇪🇸 [Español](README.md) | 🇬🇧 English

<div align="center">
  <img src="https://i.imgur.com/A5VHro2.png" alt="Proyecto Grand Order" width="120" />
  <h1>Proyecto Grand Order - Email Support Agent</h1>
  <p>Support agent that replies to helpdesk emails with Workers AI and HTML templates.</p>

  <img src="https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Vitest-3.2-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
</div>

## Description

Support agent for Proyecto Grand Order. It receives emails, posts a summary to Discord, and generates an automated reply based on the official project documentation. Replies are sent as HTML using email templates.

## Flow

```mermaid
flowchart LR
  A[Inbound email] --> B[PostalMime parse]
  B --> C[Discord webhook]
  B --> D{Allowed domain?}
  D -- no --> E[Stop]
  D -- yes --> F[Workers AI]
  F --> G[HTML sanitize]
  G --> H[TemplateMailerService]
  H --> I[Reply email]
```

## Features

- Email reception with Cloudflare Email Workers
- Parsing with PostalMime and attachment extraction
- Discord notification via webhook
- AI reply with Workers AI (text and vision)
- HTML sanitization before sending
- Production-ready HTML email templates

## Configuration

Key variables and bindings in `wrangler.jsonc`:

- `ALLOWED_EMAILS_DOMAINS`: comma-separated list
- `DISCORD_WEBHOOK_URL`: Discord webhook URL
- `EMAIL`: email sending binding
- `AI`: Workers AI binding

When you change bindings, run:

```bash
pnpm cf-typegen
```

## AI Models

- Text: `@cf/meta/llama-3.1-8b-instruct`
- Vision: `@cf/llava-hf/llava-1.5-7b-hf`

## Scripts

```bash
pnpm dev       # local development
pnpm deploy    # deploy to Cloudflare
pnpm test      # tests
```

## Resources

- Official site: https://proyectograndorder.es
- Documentation: https://proyectograndorder.es/docs
- Bug reports: https://bugs.proyectograndorder.es/
- Discord: https://discord.gg/fate-go-esp
