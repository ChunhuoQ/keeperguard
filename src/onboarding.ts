import { readFile, writeFile } from "node:fs/promises";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

interface ApiResult<T extends Record<string, unknown>> {
  status: number;
  body: T;
}

const baseUrl = process.env.KEEPERHUB_BASE_URL ?? "https://app.keeperhub.com";

function parseEnv(content: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) entries.set(match[1], match[2]);
  }
  return entries;
}

async function readEnvFile(file: string): Promise<Map<string, string>> {
  try { return parseEnv(await readFile(file, "utf8")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Map();
    throw error;
  }
}

async function saveEnvFile(file: string, values: Map<string, string>): Promise<void> {
  const orderedKeys = [
    "ETH_PRIVATE_KEY", "KEEPERHUB_API_KEY", "KEEPERHUB_BASE_URL", "KEEPERHUB_CHAIN_ID",
    "BASE_SEPOLIA_RPC_URL", "LIVE_EXECUTION", "PORT", "DATA_DIR",
  ];
  const lines = orderedKeys.map((key) => `${key}=${values.get(key) ?? ""}`);
  await writeFile(file, `${lines.join("\n")}\n`, { mode: 0o600 });
}

export async function initializeWallet(envFile = ".env"): Promise<string> {
  const values = await readEnvFile(envFile);
  if (!values.get("ETH_PRIVATE_KEY")) values.set("ETH_PRIVATE_KEY", generatePrivateKey());
  values.set("KEEPERHUB_BASE_URL", values.get("KEEPERHUB_BASE_URL") || baseUrl);
  values.set("KEEPERHUB_CHAIN_ID", values.get("KEEPERHUB_CHAIN_ID") || "84532");
  values.set("BASE_SEPOLIA_RPC_URL", values.get("BASE_SEPOLIA_RPC_URL") || "https://sepolia.base.org");
  values.set("LIVE_EXECUTION", values.get("LIVE_EXECUTION") || "false");
  values.set("PORT", values.get("PORT") || "4173");
  values.set("DATA_DIR", values.get("DATA_DIR") || "./data");
  await saveEnvFile(envFile, values);
  const account = privateKeyToAccount(values.get("ETH_PRIVATE_KEY") as `0x${string}`);
  return account.address;
}

export async function onboardKeeperHub(envFile = ".env"): Promise<{ loginAddress: string; organizationWallet: string }> {
  const values = await readEnvFile(envFile);
  const privateKey = values.get("ETH_PRIVATE_KEY") ?? process.env.ETH_PRIVATE_KEY;
  if (!privateKey) throw new Error("Run npm run wallet:init first");
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const cookies = new Map<string, string>();

  async function api<T extends Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
    const response = await fetch(baseUrl + path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
        Cookie: Array.from(cookies, ([key, value]) => `${key}=${value}`).join("; "),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(";")[0];
      const separator = pair.indexOf("=");
      cookies.set(pair.slice(0, separator).trim(), pair.slice(separator + 1));
    }
    const text = await response.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = { error: text.slice(0, 300) }; }
    return { status: response.status, body: body as T };
  }

  function must<T extends Record<string, unknown>>(response: ApiResult<T>, operation: string): T {
    if (response.status >= 400) throw new Error(`${operation}: ${response.status} ${JSON.stringify(response.body)}`);
    return response.body;
  }

  const nonce = must(await api<{ nonce: string }>("/api/auth/siwe/nonce", {
    method: "POST",
    body: JSON.stringify({ walletAddress: account.address, chainId: 1 }),
  }), "SIWE nonce");
  const message = [
    `${new URL(baseUrl).host} wants you to sign in with your Ethereum account:`,
    account.address,
    "",
    "Sign in to KeeperHub",
    "",
    `URI: ${baseUrl}`,
    "Version: 1",
    "Chain ID: 1",
    `Nonce: ${nonce.nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");
  must(await api("/api/auth/siwe/verify", {
    method: "POST",
    body: JSON.stringify({
      message,
      signature: await account.signMessage({ message }),
      walletAddress: account.address,
      chainId: 1,
    }),
  }), "SIWE verify");

  let apiKey = values.get("KEEPERHUB_API_KEY");
  if (!apiKey) {
    const keyRequest = { name: `keeperguard-${new Date().toISOString().slice(0, 10)}` };
    const challenge = await api<{ code?: string; challenge?: string }>("/api/keys", {
      method: "POST",
      body: JSON.stringify(keyRequest),
    });
    if (challenge.body.code !== "signature_required" || !challenge.body.challenge) {
      throw new Error(`Expected API key challenge: ${challenge.status} ${JSON.stringify(challenge.body)}`);
    }
    const keyResult = must(await api<{ key: string }>("/api/keys", {
      method: "POST",
      body: JSON.stringify({
        ...keyRequest,
        signature: await account.signMessage({ message: challenge.body.challenge }),
      }),
    }), "Create API key");
    apiKey = keyResult.key;
    values.set("KEEPERHUB_API_KEY", apiKey);
    await saveEnvFile(envFile, values);
  }

  let user = must(await api<{ walletAddress?: string | null }>("/api/user"), "Read user");
  for (let attempt = 0; !user.walletAddress && attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    user = must(await api<{ walletAddress?: string | null }>("/api/user"), "Read user");
  }
  if (!user.walletAddress) throw new Error("KeeperHub organization wallet is still provisioning; retry shortly");
  return { loginAddress: account.address, organizationWallet: user.walletAddress };
}
