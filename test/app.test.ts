import { describe, expect, test } from "bun:test";
import { App, createError, sendText, webHandler } from "../src";

describe("App", () => {
    test("webHandler should handle routes and errors", async () => {
        const app = new App();

        app.get("/hello", (context) => {
            return sendText(context, "Hello, World!", 200);
        });

        app.post("/error", () => {
            throw createError("Internal Server Error", 500);
        });

        const request = new Request("https://example.com/hello", { method: "GET" });
        const context = {};

        let response = await webHandler(app, request, context);
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("Hello, World!");

        const errorRequest = new Request("https://example.com/error", { method: "POST" });
        response = await webHandler(app, errorRequest, context);
        expect(response.status).toBe(500);
        expect(await response.text()).toBe("Internal Server Error");
    });
});
