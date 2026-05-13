import {
    DiscordEmbed,
    EmbedAuthor,
    EmbedField,
    EmbedFooter,
    EmbedImage,
    EmbedThumbnail
} from "@ty/embed.types"

/**
 * A builder class for constructing Discord embeds with a fluent interface. Provides methods to set various embed properties and ensures that all constraints are met before building the final embed object.
 * @example
 * const embed = new EmbedBuilder()
 *   .setTitle('Hello World')
 *   .setDescription('This is an example embed.')
 *   .setColor(0xFF0000)
 *   .addField('Field 1', 'Value 1')
 *   .addField('Field 2', 'Value 2', true)
 *   .setFooter('Footer text', 'https://example.com/icon.png')
 *   .build();
 */
export class EmbedBuilder {
    private readonly embed: DiscordEmbed = {};

    setTitle(title: string): this {
        if (title.length > 256) {
            throw new RangeError('Embed title must not exceed 256 characters.');
        }
        this.embed.title = title;
        return this;
    }

    setDescription(description: string): this {
        if (description.length > 4096) {
            throw new RangeError('Embed description must not exceed 4096 characters.');
        }
        this.embed.description = description;
        return this;
    }

    setUrl(url: string): this {
        this.embed.url = url;
        return this;
    }

    setColor(color: number): this {
        this.embed.color = color;
        return this;
    }

    setTimestamp(date: Date = new Date()): this {
        this.embed.timestamp = date.toISOString();
        return this;
    }

    setFooter(text: string, iconUrl?: string): this {
        if (text.length > 2048) {
            throw new RangeError('Embed footer text must not exceed 2048 characters.');
        }
        const footer: EmbedFooter = { text };
        if (iconUrl) footer.icon_url = iconUrl;
        this.embed.footer = footer;
        return this;
    }

    setImage(url: string): this {
        const image: EmbedImage = { url };
        this.embed.image = image;
        return this;
    }

    setThumbnail(url: string): this {
        const thumbnail: EmbedThumbnail = { url };
        this.embed.thumbnail = thumbnail;
        return this;
    }

    setAuthor(name: string, url?: string, iconUrl?: string): this {
        if (name.length > 256) {
            throw new RangeError('Embed author name must not exceed 256 characters.');
        }
        const author: EmbedAuthor = { name };
        if (url) author.url = url;
        if (iconUrl) author.icon_url = iconUrl;
        this.embed.author = author;
        return this;
    }


    addField(name: string, value: string, inline = false): this {
        if (!this.embed.fields) this.embed.fields = [];

        if (this.embed.fields.length >= 25) {
            throw new RangeError('Embeds cannot have more than 25 fields.');
        }
        if (name.length > 256) {
            throw new RangeError('Embed field name must not exceed 256 characters.');
        }
        if (value.length > 1024) {
            throw new RangeError('Embed field value must not exceed 1024 characters.');
        }

        const field: EmbedField = { name, value, inline };
        this.embed.fields.push(field);
        return this;
    }


    addFields(...fields: EmbedField[]): this {
        for (const field of fields) {
            this.addField(field.name, field.value, field.inline);
        }
        return this;
    }

    build(): DiscordEmbed {
        return { ...this.embed };
    }
}
