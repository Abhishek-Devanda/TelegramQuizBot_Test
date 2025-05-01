export const escapeMarkdownV2 = (text: string): string => {
    // Characters to escape: _ * [ ] ( ) ~ ` > # + - = | { } . !
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
  };