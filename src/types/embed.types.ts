export interface EmbedFooter {
    text: string;
    icon_url?: string;
}

export interface EmbedImage {
    url: string;
}

export interface EmbedThumbnail {
    url: string;
}

export interface EmbedAuthor {
    name: string;
    url?: string;
    icon_url?: string;
}

export interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}


export interface DiscordEmbed {
    title?: string;
    description?: string;
    url?: string;
    timestamp?: string; // ISO8601
    color?: number;
    footer?: EmbedFooter;
    image?: EmbedImage;
    thumbnail?: EmbedThumbnail;
    author?: EmbedAuthor;
    fields?: EmbedField[];
}