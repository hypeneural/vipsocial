export function formatPhoneForDisplay(phone: string): string {
    const digits = phone.replace(/\D+/g, "");

    if (digits.startsWith("55") && digits.length === 13) {
        return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }

    if (digits.startsWith("55") && digits.length === 12) {
        return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 8)}-${digits.slice(8)}`;
    }

    return digits;
}
