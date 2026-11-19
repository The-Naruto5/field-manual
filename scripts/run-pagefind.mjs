import fs from "node:fs";
import { execSync } from "node:child_process";

const siteDir = fs.existsSync(".vercel/output/static") ? ".vercel/output/static" : "dist";
console.log(`Indexing static site with Pagefind from: ${siteDir}`);
execSync(`npx pagefind --site ${siteDir}`, { stdio: "inherit" });
