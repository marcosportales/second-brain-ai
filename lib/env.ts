import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  APP_BASE_URL: z.url().default("http://localhost:3000"),
  AI_PROVIDER: z.enum(["openai", "ollama"]).default("openai"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_CHAT_MODEL: z.string().default("qwen2.5:7b"),
  OLLAMA_EMBEDDING_MODEL: z.string().optional(),
  RAG_TOP_K: z.coerce.number().int().min(1).max(20).default(5),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().min(1).max(100).default(10),
})
  .superRefine((values, ctx) => {
    if (values.AI_PROVIDER === "openai" && !values.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENAI_API_KEY"],
        message: "OPENAI_API_KEY is required when AI_PROVIDER=openai",
      });
    }
  });

export const env = envSchema.parse(process.env);
