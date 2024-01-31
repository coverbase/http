export type SameSite = "Strict" | "Lax" | "None";

export type CookieOptions = {
	domain?: string;
	expires?: Date;
	httpOnly?: boolean;
	maxAge?: number;
	path?: string;
	secure?: boolean;
	signingSecret?: string;
	sameSite?: SameSite;
	partitioned?: boolean;
};

export const fromCookieString = (cookies: string) => {
	const cookie: Record<string, string> = {};

	for (let [name, value] of cookies.split(";").map((pair) => pair.trim().split("="))) {
		value = value.trim();

		if (value.startsWith('"') && value.endsWith('"')) {
			value = value.slice(1, -1);
		}

		if (/^[ !#-:<-[\]-~]*$/.test(value)) {
			cookie[name] = decodeURIComponent(value);
		}
	}

	return cookie;
};

export const toCookieString = (name: string, value: string, options?: CookieOptions) => {
	let cookie = `${name}=${value}`;

	if (options) {
		if (options.maxAge && options.maxAge >= 0) {
			cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
		}

		if (options.domain) {
			cookie += `; Domain=${options.domain}`;
		}

		if (options.path) {
			cookie += `; Path=${options.path}`;
		}

		if (options.expires) {
			cookie += `; Expires=${options.expires.toUTCString()}`;
		}

		if (options.httpOnly) {
			cookie += "; HttpOnly";
		}

		if (options.secure) {
			cookie += "; Secure";
		}

		if (options.sameSite) {
			cookie += `; SameSite=${options.sameSite}`;
		}

		if (options.partitioned) {
			cookie += "; Partitioned";
		}
	}

	return cookie;
};
