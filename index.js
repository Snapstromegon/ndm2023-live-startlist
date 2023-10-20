import "dotenv/config";
import fastify from "fastify";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import SQL from "sql-template-strings";
import fastifyStatic from "@fastify/static";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const db = await open({
  filename: "starts.db",
  driver: sqlite3.Database,
});

const server = fastify();

server.register(fastifyStatic, {
  root: `${__dirname}/static`,
});

const fillEntryWithStart = async (entry) => {
  if (entry.event_type !== "act" || entry.start_id === null) return entry;
  entry.start = await db.get(
    SQL`SELECT id, event, category, name FROM Start WHERE id = ${entry.start_id}`
  );
  entry.start.starters = await db.all(
    SQL`SELECT id, firstname, lastname, gender, club, age FROM Starter JOIN StartStarters ON Starter.id = StartStarters.starter_id WHERE StartStarters.start_id = ${entry.start_id}`
  );
  return entry;
};

server.get("/allEntries", async () => {
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id`
  );
  return Promise.all(timeplan.map(fillEntryWithStart));
});

server.get("/currentEntry", async () => {
  let currentEntry = await db.get(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE status = "active"`
  );
  if (currentEntry === undefined) {
    currentEntry = await db.get(
      SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE status = "open" ORDER BY id ASC LIMIT 1`
    );
  }
  return fillEntryWithStart(currentEntry);
});

server.get("/allToday", async (request) => {
  const today = request.query.date || new Date().toISOString().split("T")[0];
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE Date(planned_start) = Date(${today})`
  );
  return Promise.all(timeplan.map(fillEntryWithStart));
});

const listening = await server.listen({
  port: process.env.HTTP_PORT,
  host: "0.0.0.0",
});
console.log(listening);
