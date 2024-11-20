// src/middlewares/auth-middleware.ts

import { Context, Next } from "koa";

const authMiddleware = (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: Context, next: Next) => {
    await next(); // Allow the request to proceed to /admin/login

    // Apply middleware only on the login endpoint
    if (ctx.request.url === "/admin/login" && ctx.response.status === 200) {
      console.log("Login response:", ctx.response.body); // Log the response

      // Access the token in the response structure
      const responseBody = ctx.response.body as { data?: { token?: string } };
      const token = responseBody?.data?.token;

      if (token) {
        // Set the token as an HTTP-only cookie
        ctx.cookies.set("token", token, {
          httpOnly: true, // Not accessible via JavaScript
          secure: process.env.NODE_ENV === "production", // HTTPS only in production
          maxAge: 1000 * 60 * 60 * 24, // Cookie expiration (e.g., 1 day)
          path: "/", // Cookie path
          sameSite: "strict", // Prevent CSRF attacks
        });

        // Optionally modify the response for the client
        ctx.body = { message: "Successfully logged in" };
      } else {
        console.log("Token not found in the response.");
      }
    }
  };
};

export default authMiddleware;
