// src/middlewares/auth-middleware.ts

import { Context, Next } from "koa";
import jwt from "jsonwebtoken";

const authMiddleware = (config: any, { strapi }: { strapi: any }) => {
  if (!process.env.ADMIN_JWT_SECRET) {
    throw new Error("ADMIN_JWT_SECRET is not set"); // Ensure the secret is configured
  }

  return async (ctx: Context, next: Next) => {
    await next(); // Proceed to the next middleware

    // Handle login
    if (ctx.request.url === "/admin/login" && ctx.response.status === 200) {
      const responseBody = ctx.response.body as { data?: { token?: string } };
      const token = responseBody?.data?.token;

      if (token) {
        // Save the token as an HttpOnly cookie
        ctx.cookies.set("token", token, {
          httpOnly: true, // Not accessible via JavaScript
          secure: process.env.NODE_ENV === "production", // Only available over HTTPS in production
          maxAge: 1000 * 60 * 60 * 24, // Cookie expiration (1 day)
          path: "/", // Cookie applies to the entire domain
          sameSite: "strict", // Prevents CSRF attacks
        });

        console.log("Token saved as a cookie.");
      } else {
        console.log("Token not found.");
      }
    }

    // Handle logout
    if (ctx.request.url === "/admin/logout") {
      // Remove the token from cookies
      ctx.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only available over HTTPS in production
        maxAge: 0, // Expire the cookie immediately
        path: "/",
        sameSite: "strict",
      });

      console.log("User logged out.");
      ctx.body = { message: "Successfully logged out" };
    }

    // Optional: Token verification for other requests
    const token = ctx.cookies.get("token");
    if (token) {
      try {
        const secret = process.env.ADMIN_JWT_SECRET;
        const decoded = jwt.verify(token, secret);

        console.log("Token verified:", decoded);
        ctx.state.user = decoded; // Attach user data to the context
      } catch (err) {
        console.error("Invalid token:", err.message);
        ctx.state.user = null; // Treat as logged out
      }
    } else {
      console.log("No token found.");
      ctx.state.user = null;
    }
  };
};

export default authMiddleware;
