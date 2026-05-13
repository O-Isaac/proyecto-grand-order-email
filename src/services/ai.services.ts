import { HtmlSanitizer } from "@helpers/html.helper";

interface ImageAttachment {
    content: ArrayBuffer;
    mimeType: string;
}

interface TextContentBlock {
    type: "text";
    text: string;
}

interface ImageContentBlock {
    type: "image";
    image: ArrayBuffer;
    mimeType: string;
}

type ContentBlock = TextContentBlock | ImageContentBlock;

interface AIModelResponse {
    response: string;
}

interface LlavaModelResponse {
    description: string;
}


interface IAIService {
    generateReply(emailText: string, imageAttachments?: ImageAttachment[]): Promise<string>;
}

const TEXT_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const VISION_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";
const SYSTEM_PROMPT = `Eres el agente de soporte técnico de Proyecto Grand Order, un parche de traducción al español para Fate/Grand Order (FGO). Sitio oficial: https://proyectograndorder.es

FORMATO DE RESPUESTA — CRÍTICO:
Tu respuesta debe ser ÚNICAMENTE HTML. Nada más. Sin explicaciones, sin markdown, sin texto fuera de etiquetas HTML.

EJEMPLO DE RESPUESTA CORRECTA:
<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;color:#333331;line-height:1.8;">Para solucionar el error, abre Rayshift Translate y pulsa "Uninstall". Luego reinstala el parche desde <a href="https://github.com/rayshift/translatefgo/releases" style="color:#111110;text-decoration:underline;">la página oficial</a>.</p>
<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;color:#333331;line-height:1.8;">Si el problema persiste, únete al <a href="https://discord.gg/fate-go-esp" style="color:#111110;text-decoration:underline;">Discord oficial</a> para recibir ayuda adicional.</p>

REGLAS ABSOLUTAS:
- PROHIBIDO usar asteriscos (* o **) para nada.
- PROHIBIDO usar guiones como lista (- item).
- PROHIBIDO usar números como lista (1. item).
- PROHIBIDO incluir texto fuera de etiquetas HTML.
- PROHIBIDO incluir <html>, <head>, <body>, <style>.
- PROHIBIDO usar bloques de código o comillas.
- Máximo 3 etiquetas <p>.
- No añadas saludos ni despedidas.
- No incluyas la frase del equipo de traducción.
- Solo <p> y <a> con los estilos del ejemplo.

IDIOMA: español si te hablan en español, inglés si te hablan en inglés.

ALCANCE — solo cubre:
Instalación, actualización, desinstalación del parche, Rayshift Translate, errores técnicos, compatibilidad Android, Shizuku.

Para cualquier otro tema (eventos, sorteos, lore, comunidad), deriva al Discord: https://discord.gg/fate-go-esp

DOCUMENTACIÓN OFICIAL:

Instalación: actualizar FGO, descargar datos, cerrar juego, instalar Rayshift Translate desde https://github.com/rayshift/translatefgo/releases, pulsar Install, reabrir FGO.

Actualización: abrir FGO, descargar datos, cerrar, abrir Rayshift, pulsar Update, reabrir FGO.

Desinstalación: cerrar FGO, abrir Rayshift, pulsar Uninstall, reabrir FGO.

Shizuku (Android 14+): versión recomendada shizuku-v13.6.0.r1318-thedjchi.apk desde https://github.com/thedjchi/Shizuku/releases/download/v13.6.0.r1318-thedjchi/shizuku-v13.6.0.r1318-thedjchi.apk. Activar opciones de desarrollador, depuración inalámbrica, iniciar Shizuku, conceder permisos a Rayshift, reintentar instalación.

Xiaomi/POCO/MIUI: activar "Depuración USB (Opciones de seguridad)" y "Depuración USB" por separado.
OPPO/OnePlus/ColorOS: desactivar "Monitoreo de permisos".
Meizu/Flyme: desactivar "Protección de pagos Flyme".

Error "Asset database is corrupt" o "Failed to read beyond the end of the stream": reiniciar dispositivo, cambiar Filesystem Access Mode (Android 12 o inferior usa SAF, Android moderno usa Shizuku).

Error "An internal error has occurred": alternar WiFi y datos, reiniciar, abrir Acerca de y configurar Android 11 Setup, reinstalar Rayshift.

Instalación lenta: alternar WiFi y datos móviles.

Servidor NA: compatible desde Rayshift Translate 2.0.0.

Reportar errores: https://bugs.proyectograndorder.es/
Documentación: https://proyectograndorder.es/docs
`;

/**
 * Este servicio se encarga de generar respuestas automáticas a los correos electrónicos de soporte utilizando modelos de IA de Workers AI. Toma el texto del correo y las imágenes adjuntas, construye un bloque de contenido adecuado para el modelo (texto simple o texto + imágenes), selecciona el modelo correcto según el tipo de contenido, ejecuta el modelo con un prompt específico para soporte técnico, y luego sanitiza la respuesta HTML antes de devolverla.
 * La respuesta generada sigue un formato HTML estricto para asegurar que se muestre correctamente en los clientes de correo, y el sistema prompt guía al modelo para que actúe como un agente de soporte técnico especializado en el parche de traducción de FGO.
 * El servicio es utilizado en el flujo de manejo de correos electrónicos para proporcionar respuestas automáticas a los usuarios que buscan ayuda con problemas técnicos relacionados con el parche.
 */
class ContentBlockBuilder {
    buildUserContent(emailText: string, imageAttachments: ImageAttachment[]): ContentBlock[] | string {
        if (imageAttachments.length === 0) {
            return emailText;
        }

        return [
            { type: "text", text: emailText || "El usuario ha enviado una imagen con un error." },
            ...imageAttachments.map((img): ImageContentBlock => ({
                type: "image",
                image: img.content,
                mimeType: img.mimeType,
            })),
        ];
    }

    selectModel(hasImages: boolean): string {
        return hasImages ? VISION_MODEL : TEXT_MODEL;
    }
}

/**
 * El servicio de IA se encarga de generar respuestas automáticas a los correos electrónicos de soporte utilizando los modelos de Workers AI. Utiliza el ContentBlockBuilder para construir el contenido de entrada para el modelo, selecciona el modelo adecuado según si hay imágenes adjuntas o no, ejecuta el modelo con un prompt específico para soporte técnico, y luego sanitiza la respuesta HTML antes de devolverla. Este servicio es fundamental para proporcionar respuestas rápidas y útiles a los usuarios que buscan ayuda con problemas técnicos relacionados con el parche de traducción de FGO.
 * La función generateReply es la principal, que toma el texto del correo y las imágenes adjuntas, construye el contenido para el modelo, ejecuta el modelo, y devuelve la respuesta sanitizada lista para ser enviada por correo electrónico.
 */
class AIModelClient {
    constructor(private ai: Env["AI"]) {}

    async run(model: string, userContent: ContentBlock[] | string): Promise<string> {
        const isVision = model === VISION_MODEL;

        const response = isVision
            ? await this.runVisionModel(userContent as ContentBlock[])
            : await this.runTextModel(userContent as string);

        return response;
    }

    private async runTextModel(userContent: string): Promise<string> {
        const response = await this.ai.run(TEXT_MODEL, {
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userContent },
            ],
        });

        if (typeof response === "object" && response !== null && "response" in response) {
            return (response as unknown as AIModelResponse).response;
        }

        throw new Error("Unexpected response format from text model");
    }

    private async runVisionModel(blocks: ContentBlock[]): Promise<string> {
        const imageBlock = blocks.find((b): b is ImageContentBlock => b.type === "image");
        const textBlock = blocks.find((b): b is TextContentBlock => b.type === "text");

        if (!imageBlock) {
            throw new Error("Vision model called without image block");
        }

        const response = await this.ai.run("@cf/llava-hf/llava-1.5-7b-hf", {
            image: [...new Uint8Array(imageBlock.image)],
            prompt: `${SYSTEM_PROMPT}\n\nUSER: ${textBlock?.text ?? "Describe el error en esta imagen."}\nASSISTANT:`,
            max_tokens: 1000,
        });

        if (typeof response === "object" && response !== null && "description" in response) {
            return (response as unknown as LlavaModelResponse).description;
        }

        throw new Error("Unexpected response format from vision model");
    }
}

/**
 * El servicio de IA se encarga de generar respuestas automáticas a los correos electrónicos de soporte utilizando los modelos de Workers AI. Utiliza el ContentBlockBuilder para construir el contenido de entrada para el modelo, selecciona el modelo adecuado según si hay imágenes adjuntas o no, ejecuta el modelo con un prompt específico para soporte técnico, y luego sanitiza la respuesta HTML antes de devolverla. Este servicio es fundamental para proporcionar respuestas rápidas y útiles a los usuarios que buscan ayuda con problemas técnicos relacionados con el parche de traducción de FGO.
 * La función generateReply es la principal, que toma el texto del correo y las imágenes adjuntas, construye el contenido para el modelo, ejecuta el modelo, y devuelve la respuesta sanitizada lista para ser enviada por correo electrónico.
 */
export class AIService implements IAIService {
    private readonly sanitizer = new HtmlSanitizer();
    private readonly contentBuilder = new ContentBlockBuilder();
    private readonly modelClient: AIModelClient;

    constructor(ai: Env["AI"]) {
        this.modelClient = new AIModelClient(ai);
    }

    async generateReply(emailText: string, imageAttachments: ImageAttachment[] = []): Promise<string> {
        const userContent = this.contentBuilder.buildUserContent(emailText, imageAttachments);
        const model = this.contentBuilder.selectModel(imageAttachments.length > 0);
        const raw = await this.modelClient.run(model, userContent);
        return this.sanitizer.sanitize(raw);
    }
}