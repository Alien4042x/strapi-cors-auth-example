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

const authMiddleware = (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: Context, next: Next) => {
    await next(); // Allow the request to proceed to /admin/login

    if (ctx.request.url === "/admin/login" && ctx.response.status === 200) {
      console.log("Login response:", ctx.response.body);

      const responseBody = ctx.response.body as { data?: { token?: string } };
      const token = responseBody?.data?.token;

      if (token) {
        ctx.cookies.set("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 1000 * 60 * 60 * 24,
          path: "/",
          sameSite: "strict",
        });

        ctx.body = { message: "Successfully logged in" };
      } else {
        console.log("Token not found in the response.");
      }
    }
  };
};

export default authMiddleware;
```

To use the Auth middleware, you need to install the following package:

```bash
npm install @koa/cors --save

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
