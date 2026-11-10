// Pages that render without a session and without the app shell.
const PUBLIC = ["/welcome", "/privacy", "/terms", "/trust", "/start"];
export const isPublicPage = (path: string) => PUBLIC.includes(path) || path.startsWith("/p/");
