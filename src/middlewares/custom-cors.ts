// src/middlewares/custom-cors.ts

export default () => {
  return async (ctx, next) => {
    await next(); // Let the request pass through all previous middleware

    // Override Access-Control-Allow-Origin headers and other CORS headers
    if (ctx.get("Origin") && ctx.response.status !== 404) {
      const allowedOrigins = ["http://localhost:3000"]; // Add allowed origins here
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
        ctx.set("Access-Control-Allow-Credentials", "true"); // Allow cookies
      }
    }
  };
};
