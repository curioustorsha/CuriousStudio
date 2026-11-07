// Not after a word character, so email addresses aren't mentions.
const MENTION = /(?<![\w@./-])@([a-z0-9_-]{2,20})(?![\w-])/gi;

/** The known usernames tagged in a text, each once. */
export function mentionedUsernames(text: string, usernames: string[]) {
  const found = [...text.matchAll(MENTION)].map((m) => m[1].toLowerCase());
  return [...new Set(found)].filter((u) => usernames.includes(u));
}

/** Turns known @mentions into Markdown links, so they stand out in a comment. Unknown ones stay plain text. */
export function linkMentions(text: string, usernames: string[]) {
  return text.replace(MENTION, (match, name: string) => (usernames.includes(name.toLowerCase()) ? `[${match}](/users)` : match));
}
