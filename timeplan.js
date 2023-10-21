import SQL from "sql-template-strings";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

const db = await open({
  filename: "starts.db",
  driver: sqlite3.Database,
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

export const getAllEntries = async () => {
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id`
  );
  return Promise.all(timeplan.map(fillEntryWithStart));
};

export const getAllEntriesToday = async (
  today = new Date().toISOString().split("T")[0]
) => {
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE Date(planned_start) = Date(${today})`
  );
  return Promise.all(timeplan.map(fillEntryWithStart));
};

export const getCurrentEntry = async () => {
  let currentEntry = await db.get(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE status = "active"`
  );
  // Fallback to next open entry
  if (currentEntry === undefined) {
    currentEntry = await db.get(
      SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE status = "open" ORDER BY id ASC LIMIT 1`
    );
  }
  return fillEntryWithStart(currentEntry);
};

export const getUpcomingEntries = async () => {
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE status != 'done'`
  );
  return Promise.all(timeplan.map(fillEntryWithStart));
};
export const getUpcomingEntriesToday = async (
  today = new Date().toISOString().split("T")[0]
) => {
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE Date(planned_start) = Date(${today}) AND status != 'done'`
  );
  return Promise.all(timeplan.map(fillEntryWithStart));
};
