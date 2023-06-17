import { Client } from "@elastic/elasticsearch";
import fs from "fs";
import path from "path";
import { config } from "./config";
import sanitize from "sanitize-filename";

const tracking = {};

const client = new Client({
  node: config.root,
});

export async function retrieveTargets() {
  for (const target of config.targets.sort()) {
    try {
      const search = await client.search({
        index: config.index,
        from: 0,
        size: 10000,
        query: { match: { category: target } },
      });

      console.log({
        action: "saving",
        target,
        count: search?.hits?.total?.value,
      });

      fs.mkdirSync(path.join(__dirname, "raw"), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(__dirname, "raw", `${target}.json`),
        JSON.stringify(search?.hits?.hits)
      );
      tracking[target] = true;
    } catch (err) {
      console.error(err);
      tracking[target] = false;
    }
  }
}

export async function parseTargets() {
  for (const target of config.targets.sort()) {
    console.log({ action: "parsing", target });

    if (tracking[target] === true) {
      const raw = JSON.parse(
        fs.readFileSync(path.join(__dirname, "raw", `${target}.json`))
      );
      const parsed = raw.map((entry) => entry._source);
      try {
        fs.mkdirSync(path.join(__dirname, "parsed"), {
          recursive: true,
        });

        fs.writeFileSync(
          path.join(__dirname, "parsed", `${target}.json`),
          JSON.stringify(parsed, null, " ")
        );
      } catch (err) {
        console.error(err);
      }
    }
  }
}

export async function sortTargets() {
  for (const target of config.targets.sort()) {
    console.log({ action: "sorting", target });

    if (tracking[target] === true) {
      const parsed = JSON.parse(
        fs.readFileSync(path.join(__dirname, "parsed", `${target}.json`))
      );
      for (const entry of parsed) {
        try {
          fs.mkdirSync(path.join(__dirname, "sorted", `${target}`), {
            recursive: true,
          });

          fs.writeFileSync(
            path.join(
              __dirname,
              "sorted",
              `${target}`,
              `${sanitize(entry?.name)}.json`
            ),
            JSON.stringify(entry, null, " ")
          );
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
}

async function run() {
  await retrieveTargets();
  await parseTargets();
  await sortTargets();
}

run().catch(console.log);
