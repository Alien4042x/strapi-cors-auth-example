# Strapi Custom Middlewares Tutorial

## Description
This repository provides a short tutorial on creating custom middlewares in Strapi 5+. It includes examples for:
- Setting up a custom **CORS middleware**.
- Using **HTTP-only cookies** to handle admin authentication securely.

## Features
- **Custom CORS Middleware**:
  - Define allowed origins.
  - Set specific HTTP headers for cross-origin requests.
  - Allow credentials (cookies) for secure communication.

- **Authentication Middleware**:
  - Automatically store authentication tokens in HTTP-only cookies.
  - Enhance security with options like `SameSite` and `Secure`.

## How to Use
Follow the steps in this repository to implement:
1. **Custom CORS Rules**:
   - Add a custom middleware for managing CORS.
   - Configure allowed origins, methods, and headers.

2. **Admin Authentication with HTTP-Only Cookies**:
   - Automatically store the token returned by `/admin/login` as a secure HTTP-only cookie.

## Code Examples
### Custom CORS Middleware
```typescript
// src/middlewares/custom-cors.ts

export default () => {
  return async (ctx, next) => {
    await next(); // Let the request pass through all previous middleware

    if (ctx.get("Origin") && ctx.response.status !== 404) {
      const allowedOrigins = ["http://localhost:3000"];
      const requestOrigin = ctx.get("Origin");

      if (allowedOrigins.includes(requestOrigin)) {
        ctx.set("Access-Control-Allow-Origin", requestOrigin);
        ctx.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"
        );
        ctx.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, Origin, Accept"
        );
        ctx.set("Access-Control-Allow-Credentials", "true");
      }
    }
  };
};
```

### Custom Auth 
```typescript

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
```

To use the Auth middleware, you need to install the following package:

```bash
npm install @koa/cors --save
```

## Middleware Configuration

To enable the custom middlewares, update your `config/middlewares.ts` file by adding the following entries:

```javascript
export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  "strapi::cors", // The original CORS middleware must remain here, as Strapi expects it to be present
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public", // ... other default middlewares
  {
    name: "global::auth-middleware", // Adds the authentication middleware
    config: {
      // Optional configuration
    },
  },
  {
    name: "global::custom-cors", // Adds the custom CORS middleware
  },
];
```
