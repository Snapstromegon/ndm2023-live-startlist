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
    SQL`SELECT id, event, category, name, teamname FROM Start WHERE id = ${entry.start_id}`
  );
  entry.start.starters = await db.all(
    SQL`SELECT id, firstname, lastname, gender, club, age FROM Starter JOIN StartStarters ON Starter.id = StartStarters.starter_id WHERE StartStarters.start_id = ${entry.start_id}`
  );
  return entry;
};

const estimateStart = (timeplan) => {
  let lastEnd;
  for (const entry of timeplan) {
    if (entry.earliest_start) {
      entry.earliest_start = new Date(entry.earliest_start);
    }
    entry.planned_start = new Date(entry.planned_start);
    if (entry.status === "done") {
      entry.estimated_start = new Date(entry.started);
    } else if (entry.status === "active") {
      entry.estimated_start = new Date(entry.started);
      lastEnd = new Date(
        entry.estimated_start.getTime() + entry.duration_min * 60 * 1000
      );
    } else {
      entry.estimated_start = new Date(
        Math.max(
          entry.earliest_start?.getTime() || 0,
          new Date().getTime(),
          lastEnd?.getTime() || 0
        )
      );
      lastEnd = new Date(
        entry.estimated_start.getTime() + entry.duration_min * 60 * 1000
      );
    }
  }
  return timeplan;
};

export const getAllEntries = async ({ offset = 0 } = {}) => {
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id ORDER BY Timeplan.id ASC LIMIT -1 OFFSET ${offset}`
  );
  return estimateStart(await Promise.all(timeplan.map(fillEntryWithStart)));
};

export const getAllEntriesToday = async ({
  offset = 0,
  today = new Date().toISOString().split("T")[0],
} = {}) => {
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE Date(planned_start) = Date(${today}) ORDER BY Timeplan.id ASC LIMIT -1 OFFSET ${offset}`
  );
  return estimateStart(await Promise.all(timeplan.map(fillEntryWithStart)));
};

export const getCurrentEntry = async ({ offset = 0 } = {}) => {
  let currentEntry = await db.get(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE status = "active"`
  );
  // Fallback to next open entry
  if (currentEntry === undefined) {
    currentEntry = await db.get(
      SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE status = "open" ORDER BY Timeplan.id ASC LIMIT 1 OFFSET ${offset}`
    );
  }
  return fillEntryWithStart(currentEntry);
};

export const getUpcomingEntries = async ({ offset = 0 } = {}) => {
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE status != 'done' ORDER BY Timeplan.id ASC LIMIT -1 OFFSET ${offset}`
  );
  return estimateStart(await Promise.all(timeplan.map(fillEntryWithStart)));
};

export const getUpcomingEntriesToday = async ({
  offset = 0,
  today = new Date().toISOString().split("T")[0],
} = {}) => {
  const timeplan = await db.all(
    SQL`SELECT *, Timeplan.id AS 'order' FROM Timeplan LEFT JOIN StartList ON Timeplan.startlist_id = StartList.id WHERE Date(planned_start) = Date(${today}) AND status != 'done' ORDER BY Timeplan.id ASC LIMIT -1 OFFSET ${offset}`
  );
  return estimateStart(await Promise.all(timeplan.map(fillEntryWithStart)));
};

export const startNextEntry = async () => {
  await db.run(
    SQL`UPDATE Timeplan SET status = 'done' WHERE status = 'active'`
  );
  const firstOpen = await db.get(
    SQL`SELECT * FROM Timeplan WHERE status = 'open' ORDER BY Timeplan.id LIMIT 1`
  );
  if (firstOpen === undefined) return null;
  await db.run(
    SQL`UPDATE Timeplan SET status = 'active', started = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ${firstOpen.id}`
  );
  return firstOpen.id;
};

export const endCurrentEntry = async () => {
  const res = await db.run(
    SQL`UPDATE Timeplan SET status = 'done' WHERE status = 'active'`
  );
  return res.lastID;
};

export const revertStartNextEntry = async () => {
  await db.run(
    SQL`UPDATE Timeplan SET status = 'open', started = NULL WHERE status = 'active'`
  );
  const lastDone = await db.get(
    SQL`SELECT * FROM Timeplan WHERE status = 'done' ORDER BY Timeplan.id DESC LIMIT 1`
  );
  if (lastDone === undefined) return null;
  await db.run(
    SQL`UPDATE Timeplan SET status = 'active' WHERE id = ${lastDone.id}`
  );
  return lastDone.id;
};
