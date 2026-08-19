export class BlindPayError extends Error {
    public readonly status?: number;
    public readonly code?: string;

    constructor(message: string, status?: number, code?: string) {
        super(message);
        this.name = 'BlindPayError';
        this.status = status;
        this.code = code;
    }
}

export class AuthenticationError extends BlindPayError {
    constructor(message = 'Invalid API key') {
        super(message, 401, 'authentication_error');
        this.name = 'AuthenticationError';
    }
}

export class NotFoundError extends BlindPayError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'not_found');
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends BlindPayError {
    constructor(message: string) {
        super(message, 400, 'validation_error');
        this.name = 'ValidationError';
    }
}
