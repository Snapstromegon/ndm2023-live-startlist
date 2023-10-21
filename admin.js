import {
  getAllEntries,
  revertStartNextEntry,
  startNextEntry,
} from "./timeplan.js";

const updateReplicator = async () => {
  const resp = await fetch(process.env.REPLICATOR_URL, {
    method: "POST",
    body: JSON.stringify({
      data: await getAllEntries(),
      token: process.env.REPLICATOR_TOKEN,
    }),
    headers: { "Content-Type": "application/json" },
  });
  return resp.ok;
};

const adminRouter = async (fastify, options) => {
  fastify.get("/replicate", async () => updateReplicator());
  fastify.get("/startNext", async () => {
    const res = await startNextEntry();
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
