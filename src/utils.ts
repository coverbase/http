import { getQuery } from "ufo";
import { type Context } from "./app";
import { fromCookieString, toCookieString, type CookieOptions } from "./cookie";

export const sendJson = <T, V>(
	context: Context<T>,
	value: V,
	status: number = 200,
) => {
	setHeader(context, "Content-Type", "application/json");

	return new Response(JSON.stringify(value), {
		status: status,
		headers: context.set.headers,
	});
};

export const sendText = <T>(
	context: Context<T>,
	text: string,
	status: number = 200,
) => {
	setHeader(context, "Content-Type", "text/plain");

	return new Response(text, {
		status: status,
		headers: context.set.headers,
	});
};

export const sendRedirect = <T>(
	context: Context<T>,
	location: string,
	status: 301 | 302 = 302,
) => {
	setHeader(context, "Location", location);

	return new Response(null, {
		status: status,
		headers: context.set.headers,
	});
};

export const sendNoContent = <T>(context: Context<T>) => {
	return new Response(null, {
		status: 204,
		headers: context.set.headers,
	});
};

export const getRequestQuery = <T>(context: Context<T>) => {
	return getQuery(context.request.url);
};

export const getRequestHeader = <T>(context: Context<T>, name: string) => {
	return context.request.headers.get(name) ?? undefined;
};

export const getRequestHeaders = <T>(context: Context<T>) => {
	return Array.from(context.request.headers).reduce<Record<string, string>>(
		(headers, [key, value]) => {
			headers[key] = value;

			return headers;
		},
		{},
	);
};

export const setHeader = <T>(
	context: Context<T>,
	name: string,
	value: string,
) => {
	context.set.headers.set(name, value);
};

export const setHeaders = <T>(
	context: Context<T>,
	headers: Record<string, string>,
) => {
	for (const key in headers) {
		context.set.headers.set(key, headers[key]);
	}
};

export const addHeader = <T>(
	context: Context<T>,
	name: string,
	value: string,
) => {
	context.set.headers.append(name, value);
};

export const addHeaders = <T>(
	context: Context<T>,
	headers: Record<string, string>,
) => {
	for (const key in headers) {
		context.set.headers.append(key, headers[key]);
	}
};

export const getCookies = <T>(context: Context<T>) => {
	const cookies = getRequestHeader(context, "Cookie");

	return cookies ? fromCookieString(cookies) : {};
};

export const setCookie = <T>(
	context: Context<T>,
	name: string,
	value: string,
	options?: CookieOptions,
) => {
	addHeader(context, "Set-Cookie", toCookieString(name, value, options));
};

export const deleteCookie = <T>(
	context: Context<T>,
	name: string,
	options?: CookieOptions,
) => {
	setCookie(context, name, "", {
		...options,
		maxAge: 0,
	});
};
