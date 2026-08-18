import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { googleOAuthCallback } from "./googleOAuth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/google/oauth/callback",
  method: "GET",
  handler: googleOAuthCallback,
});

export default http;
