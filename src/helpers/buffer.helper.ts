export function toArrayBuffer(content: string | ArrayBuffer | Uint8Array): ArrayBuffer {
    if (content instanceof ArrayBuffer) return content;
    if (content instanceof Uint8Array) return content.buffer.slice(0) as ArrayBuffer;
    return new TextEncoder().encode(content).buffer as ArrayBuffer;
}