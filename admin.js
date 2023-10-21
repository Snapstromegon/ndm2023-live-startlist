import { getAllEntries } from "./timeplan.js";

const adminRouter = async (fastify, options) => {
  fastify.get("/replicate", async (request) => {
    const resp = await fetch(process.env.REPLICATOR_URL, {
      method: "POST",
      body: JSON.stringify({data: await getAllEntries(), token: process.env.REPLICATOR_TOKEN}),
      headers: { "Content-Type": "application/json" },
    });
    return resp.ok;
  });
};

export default adminRouter;
