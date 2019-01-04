class ErrorMixin extends Error {

    constructor(content) {
        let message;
        if (typeof content === 'object' && content !== null) {
            ({ message, ...content } = content);
        } else {
            message = content;
            content = {};
        }
        super(message);
        this.message = message;
        this.content = content;
        this.name = this.constructor.name;

        if (Error.hasOwnProperty('captureStackTraceError')) {
            Error.captureStackTrace(this);
        }
    }

    toJSON() {
        return Object.assign(this.content, {
            message: this.message,
            name: this.name,
            stacktrace: this.stack ? this.stack.split('\n').map((line) => line.trim()) : null,
        });
    }
}

class AbortError extends ErrorMixin {}

class AuthenticationError extends ErrorMixin {}

class AuthorizationError extends ErrorMixin {}

class BadRequestError extends ErrorMixin {}

class RecordExistsError extends ErrorMixin {}


export {
    AbortError,
    AuthenticationError,
    AuthorizationError,
    BadRequestError,
    RecordExistsError,
};