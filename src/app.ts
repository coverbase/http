import { Radix, combineRadix } from "@coverbase/radix";
import { sendText } from "./utils";

export type HttpMethod =
    | (string & {})
    | "GET"
    | "HEAD"
    | "POST"
    | "PUT"
    | "DELETE"
    | "CONNECT"
    | "OPTIONS"
    | "PATCH";

export type Set = {
    headers: Headers;
};

export type Context<T, P extends string = string> = T & {
    request: Request;
    parameters: Record<string, string>;
    set: Set;
};

export type Handle<TContext, TOutput> = (context: TContext) => TOutput | Promise<TOutput>;

export class HttpError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);

        this.status = status;
    }
}

export class App<T> {
    matcher: Radix<Handle<Context<T>, Response>>;
    readonly beforeHandle: Array<Handle<Context<T>, void | Response>>;

    constructor() {
        this.matcher = new Radix();
        this.beforeHandle = [];
    }

    use = <C>(app: App<C>) => {
        // @ts-ignore
        this.beforeHandle.concat(app.beforeHandle);

        // @ts-ignore
        this.matcher = combineRadix(this.matcher, app.matcher);

        return this as App<T & C>;
    };

    before = (handle: Handle<Context<T>, void | Response>) => {
        this.beforeHandle.push(handle);

        return this;
    };

    route = <P extends string>(
        method: HttpMethod,
        path: P,
        handle: Handle<Context<T, P>, Response>,
    ) => {
        this.matcher.insert(method + path, handle);

        return this;
    };

    on = <P extends string>(
        methods: Array<HttpMethod>,
        path: P,
        handle: Handle<Context<T, P>, Response>,
    ) => {
        for (const method of methods) {
            this.route(method, path, handle);
        }

        return this;
    };

    get = <P extends string>(path: P, handle: Handle<Context<T, P>, Response>) => {
        return this.route("GET", path, handle);
    };

    head = <P extends string>(path: P, handle: Handle<Context<T, P>, Response>) => {
        return this.route("HEAD", path, handle);
    };

    post = <P extends string>(path: P, handle: Handle<Context<T, P>, Response>) => {
        return this.route("POST", path, handle);
    };

    put = <P extends string>(path: P, handle: Handle<Context<T, P>, Response>) => {
        return this.route("PUT", path, handle);
    };

    delete = <P extends string>(path: P, handle: Handle<Context<T, P>, Response>) => {
        return this.route("DELETE", path, handle);
    };

    connect = <P extends string>(path: P, handle: Handle<Context<T, P>, Response>) => {
        return this.route("CONNECT", path, handle);
    };

    options = <P extends string>(path: P, handle: Handle<Context<T, P>, Response>) => {
        return this.route("OPTIONS", path, handle);
    };
}

export const createError = (message: string, status: number): HttpError => {
    return new HttpError(message, status);
};

export const webHandler = async <T>(
    app: App<T>,
    request: Request,
    context: T,
): Promise<Response> => {
    const httpContext: Context<T> = {
        request: request,
        parameters: {},

        set: {
            headers: new Headers() as Headers,
        },

        ...context,
    };

    try {
        for (const handle of app.beforeHandle) {
            const response = await handle(httpContext);

            if (response) {
                return response;
            }
        }

        const match = app.matcher.match(request.method + new URL(request.url).pathname);

        if (match) {
            httpContext.parameters = match.parameters;

            return await match.value(httpContext);
        }
    } catch (error) {
        if (error instanceof HttpError) {
            return sendText(httpContext, error.message, error.status);
        }

        throw error;
    }

    return sendText(httpContext, "Not Found", 404);
};
