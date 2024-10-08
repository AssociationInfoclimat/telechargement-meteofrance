export interface APIResponse<T = unknown> {
    code: number;
    message: string;
    data: T;
}

export class UnexpectedResponseError extends Error {
    constructor({ code, message, data }: APIResponse) {
        super(`Unexpected response: [${code}] '${message}'\n${JSON.stringify(data)}`);
    }
}

export class TooManyRetriesError extends Error {
    constructor({ code, message, data }: APIResponse) {
        super(`Too many retries. Last response: [${code}] '${message}'\n${JSON.stringify(data)}`);
    }
}
