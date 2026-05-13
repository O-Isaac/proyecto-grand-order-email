<div align="center">
  <img src="https://i.imgur.com/A5VHro2.png" alt="Proyecto Grand Order" width="120" />
  <h1>Proyecto Grand Order - Email Support Agent</h1>
  <p>Agente para responder correos electronicos de soporte con Workers AI y plantillas HTML.</p>

  <img src="https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Vitest-3.2-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
</div>

## Descripcion

Agente de soporte para Proyecto Grand Order. Recibe correos, los resume para Discord y genera una respuesta automatica con el contenido oficial del proyecto. La respuesta se envia en HTML usando plantillas de email.

## Flujo

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

## Caracteristicas

- Recepcion de emails con Cloudflare Email Workers
- Parseo con PostalMime y extraccion de adjuntos
- Notificacion a Discord via webhook
- Respuesta con Workers AI (texto y vision)
- Sanitizado de HTML antes de enviar
- Plantillas HTML listas para email

## Configuracion

Variables y bindings clave en `wrangler.jsonc`:

- `ALLOWED_EMAILS_DOMAINS`: lista separada por comas
- `DISCORD_WEBHOOK_URL`: webhook de Discord
- `EMAIL`: binding de envio de correos
- `AI`: binding de Workers AI

Cuando cambies bindings, ejecuta:

```bash
pnpm cf-typegen
```

## Modelos de IA

- Texto: `@cf/meta/llama-3.1-8b-instruct`
- Vision: `@cf/llava-hf/llava-1.5-7b-hf`

## Scripts

```bash
pnpm dev       # desarrollo local
pnpm deploy    # despliegue a Cloudflare
pnpm test      # pruebas
```

## Recursos

- Sitio oficial: https://proyectograndorder.es
- Documentacion: https://proyectograndorder.es/docs
- Reporte de bugs: https://bugs.proyectograndorder.es/
- Discord: https://discord.gg/fate-go-esp
