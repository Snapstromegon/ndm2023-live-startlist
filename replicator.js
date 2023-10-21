import fastifyCors from "@fastify/cors";
import "dotenv/config";
import fastify from "fastify";

const server = fastify();
server.register(fastifyCors, {
  origin: "*",
  methods: ["GET"],
});

let cache;

server.post("/replicate", async (request, response) => {
  const { data, token } = request.body;
  if (token !== process.env.REPLICATOR_TOKEN) {
    response.status(403);
    return "forbidden";
  }
  cache = data;
  console.log(cache, typeof cache);
  return "ok";
});

server.get("/", async () => "ok");

server.get("/allEntries", async () => cache);
server.get("/currentEntry", async () => cache.find((entry) => entry.status !== "done"));
server.get("/allToday", async (request) => {
  const today = request.query.date || new Date().toISOString().split("T")[0];
  return cache.filter((entry) => entry.planned_start.split("T")[0] === today);
});
server.get("/upcoming/all", async () => cache.filter((entry) => entry.status !== "done"));
server.get("/upcoming/allToday", async (request) => {
  const today = request.query.date || new Date().toISOString().split("T")[0];
  return cache.filter((entry) => entry.planned_start.split("T")[0] === today && entry.status !== "done");
});

const listening = await server.listen({
  port: process.env.REPLICATOR_HTTP_PORT || 8001,
  host: "0.0.0.0",
});
console.log(listening);
