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

const server = fastify({
  logger: true,
});

server.register(fastifyCors, {
  origin: "*",
  methods: ["GET"],
});
server.register(fastifyStatic, {
  root: `${__dirname}/static`,
});

let i = 0;
// setInterval(() => {
//   console.log("Fake Offset", ++i);
// }, 5000);

server.get("/allEntries", async () => getAllEntries({ offset: i }));

server.get("/currentEntry", async () => await getCurrentEntry({ offset: i }));

server.get("/allToday", async (request) => {
  const today = request.query.date || new Date().toISOString().split("T")[0];
  return getAllEntriesToday({ today, offset: i });
});

server.get("/upcoming/all", async () => getUpcomingEntries({ offset: i }));

server.get("/upcoming/allToday", async (request) => {
  const today = request.query.date || new Date().toISOString().split("T")[0];
  return getUpcomingEntriesToday({ today, offset: i });
});

server.register(adminRouter, { prefix: "/admin" });

const listening = await server.listen({
  port: process.env.HTTP_PORT,
  host: "0.0.0.0",
});
console.log(listening);
