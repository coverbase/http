import { defu } from "defu";
import type { Context, Middleware } from "./app";
import { sendNoContent, setHeader } from "./utils";

export type CorsOptions<T> = {
    origin?: string | ((context: Context<T>) => string);
    allowHeaders?: Array<string>;
    allowMethods?: Array<string>;
    exposeHeaders?: Array<string>;
    credentials?: boolean;
    maxAge?: number;
};

export const cors = <T>(options?: CorsOptions<T>): Middleware<T> => {
    return (context, next) => {
        const cors = defu(options, {
            origin: "*",
            allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
            allowHeaders: [],
            exposeHeaders: [],
        });

        const origin = typeof cors.origin === "string" ? cors.origin : cors.origin(context);
        setHeader(context, "Access-Control-Allow-Origin", origin);

        if (cors.exposeHeaders.length) {
            setHeader(context, "Access-Control-Expose-Headers", cors.exposeHeaders.join(", "));
        }

        if (cors.credentials) {
            setHeader(context, "Access-Control-Allow-Credentials", "true");
        }

        if (context.request.method === "OPTIONS") {
            if (cors.allowHeaders.length) {
                setHeader(context, "Access-Control-Allow-Headers", cors.allowHeaders.join(", "));
            }

            if (cors.allowMethods.length) {
                setHeader(context, "Access-Control-Allow-Methods", cors.allowMethods.join(", "));
            }

            if (cors.maxAge) {
                setHeader(context, "Access-Control-Max-Age", cors.maxAge.toString());
            }

            return sendNoContent(context);
        }

        return next(context);
    };
};
