import fastifyStatic from "@fastify/static";
import "dotenv/config.js";
import fastify from "fastify";
import path from "path";
import { readdir } from "node:fs/promises";
import * as url from "url";
import fastifyCors from "@fastify/cors";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const server = fastify();

const getAllImages = async () => {
  const files = await readdir(process.env.PHOTO_DIR, {
    recursive: true,
    withFileTypes: true,
  });
  return files
    .filter(
      (f) => f.isFile() && !f.path.includes(".") && !f.name.startsWith(".")
    )
    .map((f) => path.relative(process.env.PHOTO_DIR, path.join(f.path, f.name)))
    .map((p) => p.replaceAll("\\", "/"));
};

const getRandomImage = async () => {
  const files = await getAllImages();
  const randomFile = files[Math.floor(Math.random() * files.length)];
  return randomFile;
};
server.register(fastifyCors, {
  origin: "*",
  methods: ["GET"],
});
server.register(fastifyStatic, {
  root: path.resolve(__dirname, process.env.PHOTO_DIR),
});

server.get("/random", async () => getRandomImage());

const listening = await server.listen({
  port: 8001,
  host: "0.0.0.0",
});
console.log(listening);
