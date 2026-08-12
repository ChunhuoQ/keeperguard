import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  KEEPERHUB_API_KEY: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().startsWith("kh_").optional(),
  ),
  KEEPERHUB_BASE_URL: z.string().url().default("https://app.keeperhub.com"),
  KEEPERHUB_CHAIN_ID: z.coerce.number().int().positive().default(84532),
  BASE_SEPOLIA_RPC_URL: z.string().url().default("https://sepolia.base.org"),
  LIVE_EXECUTION: z.enum(["true", "false"]).default("false"),
  KEEPERGUARD_ACTION_AMOUNT: z.string().regex(/^\d+(\.\d+)?$/).default("0"),
  PORT: z.coerce.number().int().positive().default(4173),
  DATA_DIR: z.string().default("./data"),
});

export const config = schema.parse(process.env);
