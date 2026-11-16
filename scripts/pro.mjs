import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const repo = process.env.PRO_REGISTRY_REPO;
const token = process.env.PRO_GITHUB_TOKEN;

if (existsSync("pro")) {
  console.log("pro: using the existing checkout");
} else if (!repo || !token) {
  console.log("pro: PRO_REGISTRY_REPO or PRO_GITHUB_TOKEN not set, pro demos will show as locked");
} else {
  try {
    execFileSync(
      "git",
      ["clone", "--depth", "1", "--quiet", `https://x-access-token:${token}@github.com/${repo}.git`, "pro"],
      { stdio: "ignore" },
    );
  } catch {
    // node's error repeats the command line, which holds the token, so never print it
    console.error(`pro: could not clone ${repo}, check PRO_GITHUB_TOKEN can read it`);
    process.exit(1);
  }
  console.log(`pro: cloned ${repo}`);
}
