import { config } from "./config";
import fs from "fs";
import path from "path";

export async function uploadTargets() {
  for (const target of config.targets) {
    console.log({ target });

    for (const target of config.targets.sort()) {
      const raw = JSON.parse(
        fs.readFileSync(path.join(__dirname, "raw", `${target}.json`))
      );
      for (const entry of raw) {
        try {
          console.log(entry);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
}

async function run() {
  await uploadTargets();
}

run().catch(console.log);
