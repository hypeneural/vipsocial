export type FestaDivinoFieldErrors = Record<string, string>;

type LaravelErrorResponse = {
    response?: {
        data?: {
            message?: string;
            errors?: Record<string, string[]>;
        };
    };
    message?: string;
};

export function getFestaDivinoFieldErrors(error: unknown): FestaDivinoFieldErrors {
    const responseErrors = (error as LaravelErrorResponse).response?.data?.errors;

    if (!responseErrors) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(responseErrors)
            .map(([field, messages]) => [field, messages[0]])
            .filter(([, message]) => Boolean(message))
    );
}

export function getFestaDivinoApiMessage(error: unknown, fallback = "Nao foi possivel salvar."): string {
    const maybeError = error as LaravelErrorResponse;
    const validationMessage = Object.values(maybeError.response?.data?.errors ?? {})[0]?.[0];

    return validationMessage ?? maybeError.response?.data?.message ?? maybeError.message ?? fallback;
}
