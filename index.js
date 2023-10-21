import "dotenv/config";
import fastify from "fastify";
import {
  getAllEntries,
  getAllEntriesToday,
  getCurrentEntry,
  getUpcomingEntries,
  getUpcomingEntriesToday,
} from "./timeplan.js";
import fastifyStatic from "@fastify/static";

import * as url from "url";
import fastifyCors from "@fastify/cors";
import adminRouter from "./admin.js";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const server = fastify();

server.register(fastifyCors, {
  origin: "*",
  methods: ["GET"],
});
server.register(fastifyStatic, {
  root: `${__dirname}/static`,
});

server.get("/allEntries", async () => getAllEntries());

server.get("/currentEntry", async () => getCurrentEntry());

server.get("/allToday", async (request) => {
  const today = request.query.date || new Date().toISOString().split("T")[0];
  return getAllEntriesToday(today);
});

server.get("/upcoming/all", async () => getUpcomingEntries());

server.get("/upcoming/allToday", async (request) => {
  const today = request.query.date || new Date().toISOString().split("T")[0];
  return getUpcomingEntriesToday(today);
});

server.register(adminRouter, { prefix: "/admin" });

const listening = await server.listen({
  port: process.env.HTTP_PORT,
  host: "0.0.0.0",
});
console.log(listening);
