import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditEvent, TransferIntent } from "./types.js";

interface PersistedState {
  intents: Record<string, { intent: TransferIntent; status: string; executionId?: string; transactionHash?: string }>;
}

export class StateStore {
  private readonly stateFile: string;
  private readonly auditFile: string;

  constructor(private readonly directory: string) {
    this.stateFile = path.join(directory, "state.json");
    this.auditFile = path.join(directory, "audit.jsonl");
  }

  private async load(): Promise<PersistedState> {
    try {
      return JSON.parse(await readFile(this.stateFile, "utf8")) as PersistedState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { intents: {} };
      throw error;
    }
  }

  private async save(state: PersistedState): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const temporary = `${this.stateFile}.tmp`;
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.stateFile);
  }

  async persistIntent(key: string, intent: TransferIntent): Promise<void> {
    const state = await this.load();
    const existing = state.intents[key];
    if (existing && JSON.stringify(existing.intent) !== JSON.stringify(intent)) {
      throw new Error(`Intent conflict for ${key}`);
    }
    state.intents[key] ??= { intent, status: "pending" };
    await this.save(state);
  }

  async transition(key: string, update: { status: string; executionId?: string; transactionHash?: string }): Promise<void> {
    const state = await this.load();
    if (!state.intents[key]) throw new Error(`Unknown intent ${key}`);
    Object.assign(state.intents[key], update);
    await this.save(state);
  }

  async inspectIntent(key: string): Promise<PersistedState["intents"][string] | undefined> {
    return (await this.load()).intents[key];
  }

  async audit(event: AuditEvent): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    await appendFile(this.auditFile, `${JSON.stringify(event)}\n`, { mode: 0o600 });
  }

  async auditTrail(): Promise<AuditEvent[]> {
    try {
      const content = await readFile(this.auditFile, "utf8");
      return content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as AuditEvent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
}
