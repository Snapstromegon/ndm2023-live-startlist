import { mkdir, writeFile } from "fs/promises";

const writeName = async (name) =>
  writeFile("konstantin/name.txt", name, { encoding: "utf-8" });
const writeTeam = async (team) =>
  writeFile("konstantin/team.txt", team, { encoding: "utf-8" });

export const writeTimeplanEntry = async (entry) => {
  await mkdir("konstantin", { recursive: true });
  if (entry.event_type == "act") {
    if (entry.start) {
      if (entry.start.starters.length <= 2) {
        await writeName(
          entry.start.starters
            .map((starter) => starter.firstname + " " + starter.lastname)
            .join(" und ")
        );
        if (
          entry.start.starters.length === 2 &&
          entry.start.starters[0].club.toLowerCase() !==
            entry.start.starters[1].club.toLowerCase()
        ) {
          await writeTeam(
            entry.start.starters.map((s) => s.club).join(" und ")
          );
        } else {
          await writeTeam(entry.start.starters[0].club);
        }
      } else {
        await writeName(entry.start.name);
        await writeTeam(entry.start.teamname);
      }
    } else {
      await writeName(entry.label);
      await writeTeam(entry.start_group);
    }
  } if (entry.event_type == "break:warmup") {
    await writeName("Einfahrzeit");
    await writeTeam("");
    
  } else {
    await writeName("");
    await writeTeam("");
  }
};
