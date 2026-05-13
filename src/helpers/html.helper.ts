const PARAGRAPH_STYLE =
    "margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:15.5px;color:#333331;line-height:1.8;";

export class HtmlSanitizer {
    private stripMarkdown(input: string): string {
        return input
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/\*(.+?)\*/g, "$1")
            .replace(/^#{1,6}\s+/gm, "")
            .replace(/^\s*[-*+]\s+/gm, "")
            .replace(/^\s*\d+\.\s+/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    private wrapPlainTextInParagraphs(text: string): string {
        const cleaned = this.stripMarkdown(text.replace(/<[^>]*>/g, ""));
        return cleaned
            .split(/\n{2,}/)
            .filter(Boolean)
            .slice(0, 3)
            .map((para) => `<p style="${PARAGRAPH_STYLE}">${para.trim()}</p>`)
            .join("\n");
    }

    private normalizeHtmlTags(text: string): string {
        return text
            .replace(/<\s*style=/gi, "<p style=")
            .replace(/<\s*href=/gi, "<a href=")
            .replace(/<(?!\/?\s*(p|a)\b)[^>]*>/gi, "")
            .replace(/<\s*p\b[^>]*>/gi, `<p style="${PARAGRAPH_STYLE}">`);
    }

    sanitize(raw: string): string {
        let text = raw
            .replace(/```[\s\S]*?```/g, (match) =>
                match.replace(/^```\w*\n?/, "").replace(/\n?```$/, "")
            )
            .replace(/<\/?(html|head|body|style)[^>]*>/gi, "")
            .trim();

        text = this.normalizeHtmlTags(text);

        const hasAllowedTags = /<\/?\s*(p|a)\b/i.test(text);
        if (!hasAllowedTags) {
            return this.wrapPlainTextInParagraphs(text);
        }

        return this.stripMarkdown(text);
    }
}
