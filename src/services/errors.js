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

    if (Error.captureStackTraceError) {
      Error.captureStackTrace(this);
    }
  }

  toJSON() {
    return Object.assign(this.content, {
      message: this.message,
      name: this.name,
      stacktrace: this.stack ? this.stack.trim() : null,
    });
  }
}

class AbortError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'AbortError';
  }
}

class AuthenticationError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'AuthorizationError';
  }
}

class BadRequestError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'BadRequestError';
  }
}

class RecordExistsError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'RecordExistsError';
  }
}


export {
  AbortError,
  AuthenticationError,
  AuthorizationError,
  BadRequestError,
  RecordExistsError,
};
