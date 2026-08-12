import { writeFile } from "node:fs/promises";
import { KeeperGuardAgent } from "./agent.js";
import { config } from "./config.js";
import { confirmedSignals, demoPolicy, rejectedSignals } from "./fixtures.js";
import { KeeperHubClient } from "./keeperhub.js";
import { initializeWallet, onboardKeeperHub } from "./onboarding.js";
import { StateStore } from "./state.js";

const command = process.argv[2] ?? "demo";
const placeholder = "0x0000000000000000000000000000000000000001" as const;

if (command === "wallet-init") {
  const address = await initializeWallet();
  console.log(`Dedicated KeeperGuard login wallet created: ${address}`);
} else if (command === "onboard") {
  const result = await onboardKeeperHub();
  console.log(`KeeperHub account ready. Login wallet: ${result.loginAddress}`);
  console.log(`KeeperHub organization wallet: ${result.organizationWallet}`);
} else if (command === "preflight") {
  if (!config.KEEPERHUB_API_KEY) throw new Error("KEEPERHUB_API_KEY is missing; run npm run keeperhub:onboard");
  const client = new KeeperHubClient(config.KEEPERHUB_API_KEY, config.KEEPERHUB_BASE_URL, config.BASE_SEPOLIA_RPC_URL);
  const chains = await client.listChains();
  console.log(JSON.stringify({ ready: true, configuredChainId: config.KEEPERHUB_CHAIN_ID, chains }, null, 2));
} else if (command === "proof") {
  if (!config.KEEPERHUB_API_KEY) throw new Error("KEEPERHUB_API_KEY is missing; run npm run keeperhub:onboard");
  const result = await onboardKeeperHub();
  const store = new StateStore(config.DATA_DIR);
  const client = new KeeperHubClient(config.KEEPERHUB_API_KEY, config.KEEPERHUB_BASE_URL, config.BASE_SEPOLIA_RPC_URL);
  const incidentId = `keeperguard-proof-${new Date().toISOString().slice(0, 16)}`;
  const agent = new KeeperGuardAgent(store, client);
  const proof = await agent.run(
    incidentId,
    confirmedSignals(),
    { ...demoPolicy(result.organizationWallet as `0x${string}`), chainId: config.KEEPERHUB_CHAIN_ID },
    config.LIVE_EXECUTION === "true",
  );
  await writeFile(`${config.DATA_DIR}/live-proof.json`, `${JSON.stringify(proof, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(proof, null, 2));
} else if (command === "demo") {
  const store = new StateStore(config.DATA_DIR);
  const agent = new KeeperGuardAgent(store);
  const now = new Date();
  const approved = await agent.run(`demo-approved-${now.toISOString()}`, confirmedSignals(now), demoPolicy(placeholder), false, now);
  const rejected = await agent.run(`demo-rejected-${now.toISOString()}`, rejectedSignals(now), demoPolicy(placeholder), false, now);
  console.log(JSON.stringify({ approved, rejected }, null, 2));
} else {
  throw new Error(`Unknown command: ${command}`);
}
