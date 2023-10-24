import {
  getAllEntries,
  revertStartNextEntry,
  startNextEntry,
  endCurrentEntry,
} from "./timeplan.js";

const updateReplicator = async () => {
  try {
    const resp = await fetch(process.env.REPLICATOR_URL, {
      method: "POST",
      body: JSON.stringify({
        data: await getAllEntries(),
        token: process.env.REPLICATOR_TOKEN,
      }),
      headers: { "Content-Type": "application/json" },
    });
    return resp.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// Update replicator at least every minute
setInterval(updateReplicator, 1000 * 60);

const adminRouter = async (fastify, options) => {
  fastify.get("/replicate", async () => updateReplicator());
  fastify.get("/startNext", async () => {
    const res = await startNextEntry();
    updateReplicator();
    return res;
  });
  fastify.get("/endCurrent", async () => {
    const res = await endCurrentEntry();
    updateReplicator();
    return res;
  });
  fastify.get("/revertStartNext", async () => {
    const res = await revertStartNextEntry();
    updateReplicator();
    return res;
  });
};

export default adminRouter;
