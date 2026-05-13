export class AuthService {
    static isDomainAllowed(fromEmail: string, allowedDomainsStr: string): boolean {
        const allowedDomains = allowedDomainsStr.split(",").map(d => d.trim().toLowerCase());
        const domain = fromEmail.split("@")[1]?.toLowerCase();
        return !!domain && allowedDomains.includes(domain);
    }
}