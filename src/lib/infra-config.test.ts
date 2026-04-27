/**
 * Infrastructure Configuration Tests
 *
 * Validates config files added/modified in the production setup PR:
 *   - .dockerignore
 *   - .gitignore
 *   - .env.example
 *   - .github/workflows/production-checks.yml (new)
 *   - Deletion of allocator-service-ci.yml and django.yml
 *   - .vercel/project.json
 *
 * Follows the project diagnostic pattern established in kernel.test.ts.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../../");

function readRoot(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf-8");
}

function rootExists(relPath: string): boolean {
  return existsSync(resolve(ROOT, relPath));
}

// ---------------------------------------------------------------------------
// .dockerignore
// ---------------------------------------------------------------------------

export function runDockerignoreTests(): boolean {
  console.log("--- .dockerignore TESTS START ---");
  let allPassed = true;

  const content = readRoot(".dockerignore");
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  const required = [
    "node_modules",
    "dist",
    ".env",
    ".git",
    ".gitignore",
    "*.log",
  ];

  for (const pattern of required) {
    const present = lines.includes(pattern);
    const result = present ? "PASS" : "FAIL";
    console.log(`[dockerignore] Pattern "${pattern}" excluded: ${result}`);
    if (!present) allPassed = false;
  }

  // Verify .env.example is NOT excluded (it should be committed)
  const envExampleSafe = !lines.some((l) => l === ".env.example" && !l.startsWith("!"));
  console.log(
    `[dockerignore] .env.example not excluded: ${envExampleSafe ? "PASS" : "FAIL"}`
  );
  if (!envExampleSafe) allPassed = false;

  // No duplicates
  const unique = new Set(lines);
  const noDups = unique.size === lines.length;
  console.log(`[dockerignore] No duplicate entries: ${noDups ? "PASS" : "FAIL"}`);
  if (!noDups) allPassed = false;

  // Has exactly 6 entries (the 6 from the diff)
  const correctCount = lines.length === 6;
  console.log(`[dockerignore] Exactly 6 entries: ${correctCount ? "PASS" : "FAIL"}`);
  if (!correctCount) allPassed = false;

  console.log("--- .dockerignore TESTS COMPLETE ---");
  return allPassed;
}

// ---------------------------------------------------------------------------
// .gitignore
// ---------------------------------------------------------------------------

export function runGitignoreTests(): boolean {
  console.log("--- .gitignore TESTS START ---");
  let allPassed = true;

  const content = readRoot(".gitignore");
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  const required = [
    "node_modules/",
    "build/",
    "dist/",
    "coverage/",
    ".DS_Store",
    "*.log",
    ".env*",
    "!.env.example",
  ];

  for (const pattern of required) {
    const present = lines.includes(pattern);
    const result = present ? "PASS" : "FAIL";
    console.log(`[gitignore] Pattern "${pattern}": ${result}`);
    if (!present) allPassed = false;
  }

  // .env* should appear before !.env.example (negation must come after)
  const envStarIdx = lines.indexOf(".env*");
  const envExampleIdx = lines.indexOf("!.env.example");
  const orderCorrect = envStarIdx !== -1 && envExampleIdx !== -1 && envStarIdx < envExampleIdx;
  console.log(`[gitignore] .env* appears before !.env.example: ${orderCorrect ? "PASS" : "FAIL"}`);
  if (!orderCorrect) allPassed = false;

  // Has exactly 8 entries
  const correctCount = lines.length === 8;
  console.log(`[gitignore] Exactly 8 entries: ${correctCount ? "PASS" : "FAIL"}`);
  if (!correctCount) allPassed = false;

  console.log("--- .gitignore TESTS COMPLETE ---");
  return allPassed;
}

// ---------------------------------------------------------------------------
// .env.example
// ---------------------------------------------------------------------------

export function runEnvExampleTests(): boolean {
  console.log("--- .env.example TESTS START ---");
  let allPassed = true;

  const content = readRoot(".env.example");

  // Required keys present
  const requiredKeys = ["PROJECT_ID", "GEMINI_API_KEY"];
  for (const key of requiredKeys) {
    const present = content.includes(`${key}=`);
    console.log(`[env.example] Key "${key}" present: ${present ? "PASS" : "FAIL"}`);
    if (!present) allPassed = false;
  }

  // Values should be empty (this is an example file, not a secrets file)
  const lines = content.split("\n").filter((l) => l.includes("=") && !l.startsWith("#"));
  for (const line of lines) {
    const [, value] = line.split("=");
    const isEmpty = value === undefined || value.trim() === "";
    const key = line.split("=")[0].trim();
    console.log(`[env.example] "${key}" has no committed value: ${isEmpty ? "PASS" : "FAIL"}`);
    if (!isEmpty) allPassed = false;
  }

  // File is not a real .env (should not be named .env)
  const notRealEnv = !rootExists(".env");
  console.log(`[env.example] No committed .env file: ${notRealEnv ? "PASS" : "FAIL"}`);
  if (!notRealEnv) allPassed = false;

  // Comment header present
  const hasComment = content.includes("#");
  console.log(`[env.example] Contains documentation comments: ${hasComment ? "PASS" : "FAIL"}`);
  if (!hasComment) allPassed = false;

  console.log("--- .env.example TESTS COMPLETE ---");
  return allPassed;
}

// ---------------------------------------------------------------------------
// .github/workflows/production-checks.yml (new workflow)
// ---------------------------------------------------------------------------

export function runProductionChecksWorkflowTests(): boolean {
  console.log("--- production-checks.yml TESTS START ---");
  let allPassed = true;

  const wfPath = ".github/workflows/production-checks.yml";
  const exists = rootExists(wfPath);
  console.log(`[workflow] production-checks.yml exists: ${exists ? "PASS" : "FAIL"}`);
  if (!exists) {
    allPassed = false;
    console.log("--- production-checks.yml TESTS COMPLETE ---");
    return allPassed;
  }

  const content = readRoot(wfPath);

  // Workflow name
  const hasName = content.includes("name: OMEGA LATTICE Production Checks");
  console.log(`[workflow] Correct workflow name: ${hasName ? "PASS" : "FAIL"}`);
  if (!hasName) allPassed = false;

  // Triggers on push to main and master
  const triggerMainPush = content.includes("main") && content.includes("master");
  console.log(`[workflow] Triggers on push to main/master: ${triggerMainPush ? "PASS" : "FAIL"}`);
  if (!triggerMainPush) allPassed = false;

  // Has both push and pull_request triggers
  const hasPushTrigger = content.includes("push:");
  const hasPRTrigger = content.includes("pull_request:");
  console.log(`[workflow] Has push trigger: ${hasPushTrigger ? "PASS" : "FAIL"}`);
  console.log(`[workflow] Has pull_request trigger: ${hasPRTrigger ? "PASS" : "FAIL"}`);
  if (!hasPushTrigger) allPassed = false;
  if (!hasPRTrigger) allPassed = false;

  // validate job exists
  const hasValidateJob = content.includes("validate:");
  console.log(`[workflow] "validate" job defined: ${hasValidateJob ? "PASS" : "FAIL"}`);
  if (!hasValidateJob) allPassed = false;

  // security-scan job exists
  const hasSecurityScan = content.includes("security-scan:");
  console.log(`[workflow] "security-scan" job defined: ${hasSecurityScan ? "PASS" : "FAIL"}`);
  if (!hasSecurityScan) allPassed = false;

  // Node matrix [18.x, 20.x]
  const has18x = content.includes("18.x");
  const has20x = content.includes("20.x");
  console.log(`[workflow] Node 18.x in matrix: ${has18x ? "PASS" : "FAIL"}`);
  console.log(`[workflow] Node 20.x in matrix: ${has20x ? "PASS" : "FAIL"}`);
  if (!has18x) allPassed = false;
  if (!has20x) allPassed = false;

  // Key steps present
  const steps = [
    { name: "actions/checkout", label: "checkout step" },
    { name: "actions/setup-node", label: "setup-node step" },
    { name: "npm install", label: "install dependencies step" },
    { name: "npm run lint", label: "lint step" },
    { name: "npm run build", label: "build step" },
    { name: "npm audit", label: "audit step" },
  ];

  for (const step of steps) {
    const present = content.includes(step.name);
    console.log(`[workflow] Contains ${step.label}: ${present ? "PASS" : "FAIL"}`);
    if (!present) allPassed = false;
  }

  // Production build uses NODE_ENV=production
  const hasProductionEnv = content.includes("NODE_ENV: production");
  console.log(`[workflow] Production build sets NODE_ENV=production: ${hasProductionEnv ? "PASS" : "FAIL"}`);
  if (!hasProductionEnv) allPassed = false;

  // Security scan uses --audit-level=high
  const hasAuditLevel = content.includes("--audit-level=high");
  console.log(`[workflow] Security audit uses --audit-level=high: ${hasAuditLevel ? "PASS" : "FAIL"}`);
  if (!hasAuditLevel) allPassed = false;

  // VITE_APP_VERSION set to commit SHA for traceability
  const hasVersionTracing = content.includes("VITE_APP_VERSION");
  console.log(`[workflow] Build includes VITE_APP_VERSION for traceability: ${hasVersionTracing ? "PASS" : "FAIL"}`);
  if (!hasVersionTracing) allPassed = false;

  // Uses ubuntu-latest runner
  const hasUbuntu = content.includes("ubuntu-latest");
  console.log(`[workflow] Uses ubuntu-latest runner: ${hasUbuntu ? "PASS" : "FAIL"}`);
  if (!hasUbuntu) allPassed = false;

  console.log("--- production-checks.yml TESTS COMPLETE ---");
  return allPassed;
}

// ---------------------------------------------------------------------------
// Deleted workflows (allocator-service-ci.yml and django.yml)
// ---------------------------------------------------------------------------

export function runDeletedWorkflowTests(): boolean {
  console.log("--- DELETED WORKFLOWS TESTS START ---");
  let allPassed = true;

  const deletedWorkflows = [
    ".github/workflows/allocator-service-ci.yml",
    ".github/workflows/django.yml",
  ];

  for (const wf of deletedWorkflows) {
    const deleted = !rootExists(wf);
    console.log(`[deleted-workflow] "${wf}" removed: ${deleted ? "PASS" : "FAIL"}`);
    if (!deleted) allPassed = false;
  }

  console.log("--- DELETED WORKFLOWS TESTS COMPLETE ---");
  return allPassed;
}

// ---------------------------------------------------------------------------
// .vercel/project.json
// ---------------------------------------------------------------------------

export function runVercelConfigTests(): boolean {
  console.log("--- .vercel/project.json TESTS START ---");
  let allPassed = true;

  const configPath = ".vercel/project.json";
  const exists = rootExists(configPath);
  console.log(`[vercel] project.json exists: ${exists ? "PASS" : "FAIL"}`);
  if (!exists) {
    allPassed = false;
    console.log("--- .vercel/project.json TESTS COMPLETE ---");
    return allPassed;
  }

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(readRoot(configPath));
  } catch {
    console.log("[vercel] project.json is valid JSON: FAIL");
    allPassed = false;
    console.log("--- .vercel/project.json TESTS COMPLETE ---");
    return allPassed;
  }

  console.log("[vercel] project.json is valid JSON: PASS");

  // projectId field exists and is non-empty string
  const hasProjectId =
    typeof config["projectId"] === "string" && config["projectId"].length > 0;
  console.log(`[vercel] "projectId" field present and non-empty: ${hasProjectId ? "PASS" : "FAIL"}`);
  if (!hasProjectId) allPassed = false;

  // orgId field exists and is non-empty string
  const hasOrgId =
    typeof config["orgId"] === "string" && (config["orgId"] as string).length > 0;
  console.log(`[vercel] "orgId" field present and non-empty: ${hasOrgId ? "PASS" : "FAIL"}`);
  if (!hasOrgId) allPassed = false;

  // projectId follows Vercel format (starts with "prj_")
  const projectIdFormat =
    typeof config["projectId"] === "string" &&
    (config["projectId"] as string).startsWith("prj_");
  console.log(`[vercel] "projectId" matches Vercel "prj_" prefix format: ${projectIdFormat ? "PASS" : "FAIL"}`);
  if (!projectIdFormat) allPassed = false;

  // orgId follows Vercel team format (starts with "team_")
  const orgIdFormat =
    typeof config["orgId"] === "string" &&
    (config["orgId"] as string).startsWith("team_");
  console.log(`[vercel] "orgId" matches Vercel "team_" prefix format: ${orgIdFormat ? "PASS" : "FAIL"}`);
  if (!orgIdFormat) allPassed = false;

  // Only expected keys (no extra secrets or misconfigurations)
  const keys = Object.keys(config);
  const onlyExpectedKeys = keys.every((k) => ["projectId", "orgId"].includes(k));
  console.log(`[vercel] Contains only "projectId" and "orgId" keys: ${onlyExpectedKeys ? "PASS" : "FAIL"}`);
  if (!onlyExpectedKeys) allPassed = false;

  console.log("--- .vercel/project.json TESTS COMPLETE ---");
  return allPassed;
}

// ---------------------------------------------------------------------------
// Suite runner
// ---------------------------------------------------------------------------

export function runInfraConfigDiagnostics(): void {
  console.log("=== INFRA CONFIG DIAGNOSTICS START ===");

  const results = [
    { name: ".dockerignore", passed: runDockerignoreTests() },
    { name: ".gitignore", passed: runGitignoreTests() },
    { name: ".env.example", passed: runEnvExampleTests() },
    { name: "production-checks.yml", passed: runProductionChecksWorkflowTests() },
    { name: "deleted workflows", passed: runDeletedWorkflowTests() },
    { name: ".vercel/project.json", passed: runVercelConfigTests() },
  ];

  console.log("\n=== SUMMARY ===");
  let overallPassed = true;
  for (const r of results) {
    const status = r.passed ? "PASS" : "FAIL";
    console.log(`  ${r.name}: ${status}`);
    if (!r.passed) overallPassed = false;
  }
  console.log(`\nOverall: ${overallPassed ? "ALL PASS" : "SOME FAILURES"}`);
  console.log("=== INFRA CONFIG DIAGNOSTICS COMPLETE ===");
}