export function asyncHandler<T extends (...args: never[]) => unknown>(handler: T): T;
export function asyncMiddleware<T extends (...args: never[]) => unknown>(handler: T): T;
