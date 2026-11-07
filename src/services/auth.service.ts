export class AuthService {
    static isDomainAllowed(fromEmail: string, allowedDomainsStr: string) {
        const allowedDomains = allowedDomainsStr.split(",").map(d => d.trim().toLowerCase());
        const domain = fromEmail.split("@")[1]?.toLowerCase();
        return !!domain && allowedDomains.includes(domain);
    }

    static isBlackListed(env: Env, fromEmail: string) {
        const blacklistedEmails = env.BACKLISTED_EMAILS.split(",").map(e => e.trim().toLowerCase());
        return blacklistedEmails.includes(fromEmail.toLowerCase());
    }
}