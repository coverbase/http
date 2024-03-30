import { sendText } from "./utils";

export type Method = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS";

export type Set = {
    headers: Headers;
};

export type Context<T> = T & {
    request: Request;
    parameters: Record<string, string>;
    set: Set;
};

export type Handle<T> = (context: Context<T>) => Response | Promise<Response>;

export type Middleware<T> = (context: Context<T>, next: Handle<T>) => Response | Promise<Response>;

export class Route<T> {
    value?: Handle<T>;
    parameter?: string;
    children: Record<string, Route<T>>;

    constructor(parameter?: string) {
        this.parameter = parameter;
        this.children = {};
    }

    insert = (key: string, value: Handle<T>) => {
        let node: Route<T> = this;

        for (const segment of key.split("/")) {
            const isParameter = segment.startsWith(":");
            const path = isParameter ? ":" : segment;

            let childNode = node.children[path];

            if (childNode === undefined) {
                childNode = isParameter ? new Route<T>(segment.substring(1)) : new Route<T>();

                node.children[path] = childNode;
            }

            node = childNode;
        }

        node.value = value;
    };

    match = (key: string) => {
        let node: Route<T> = this;
        const parameters: Record<string, string> = {};

        for (const segment of key.split("/")) {
            node = node.children[segment] ?? node.children[":"];

            if (node?.parameter) {
                parameters[node.parameter] = segment;
            }
        }

        if (node?.value) {
            return {
                value: node.value,
                parameters,
            };
        }
    };
}

export class App<T> {
    readonly rootNode: Route<T>;
    readonly middleware: Array<Middleware<T>>;

    constructor() {
        this.rootNode = new Route();

        this.middleware = [
            (context, next) => {
                try {
                    return next(context);
                } catch (error) {
                    if (error instanceof Error) {
                        return sendText(context, error.message, 400);
                    }

                    return sendText(context, "Bad Request", 400);
                }
            },
        ];
    }

    use = (middleware: Middleware<T>) => {
        this.middleware.push(middleware);
        return this;
    };

    route = (method: Method, path: string, handle: Handle<T>) => {
        this.rootNode.insert(`${method}/${path}`, handle);
        return this;
    };

    get = (path: string, handle: Handle<T>) => {
        return this.route("GET", path, handle);
    };

    head = (path: string, handle: Handle<T>) => {
        return this.route("HEAD", path, handle);
    };

    post = (path: string, handle: Handle<T>) => {
        return this.route("POST", path, handle);
    };

    put = (path: string, handle: Handle<T>) => {
        return this.route("PUT", path, handle);
    };

    delete = (path: string, handle: Handle<T>) => {
        return this.route("DELETE", path, handle);
    };

    connect = (path: string, handle: Handle<T>) => {
        return this.route("CONNECT", path, handle);
    };

    options = (path: string, handle: Handle<T>) => {
        return this.route("OPTIONS", path, handle);
    };
}

export const webHandler = <T>(app: App<T>, request: Request, context: T): Promise<Response> => {
    const url = new URL(request.url);

    const httpContext: Context<T> = {
        request,
        parameters: {},
        set: { headers: new Headers() as Headers },
        ...context,
    };

    const invoke = async (index: number): Promise<Response> => {
        if (index >= app.middleware.length) {
            const route = app.rootNode.match(`${request.method}/${url.pathname}`);

            if (route) {
                httpContext.parameters = route.parameters;

                return await route.value(httpContext);
            }

            return sendText(httpContext, "Not Found", 404);
        }

        return app.middleware[index](httpContext, () => invoke(index + 1));
    };

    return invoke(0);
};
