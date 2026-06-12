export function generateFakePhoneEnding(): string {
    return String(Math.floor(10000 + Math.random() * 90000));
}

export function generateFakePhoneEndings(count = 18): string[] {
    return Array.from({ length: count }, () => generateFakePhoneEnding());
}
