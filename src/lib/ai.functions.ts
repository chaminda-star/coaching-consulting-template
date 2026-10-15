import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { gatewayJson } from "./ai.server";

const pkg = z.object({ name: z.string().max(200), price: z.string().max(100), description: z.string().max(2000) });

export interface PackageRecommendation {
  goalsSummary: string[];
  recommendedPackage: string;
  reason: string;
}

export const recommendPackage = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ notes: z.string().min(3).max(5000), packages: z.array(pkg).max(20) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const result = await gatewayJson<PackageRecommendation>({
        name: "package_recommendation",
        system:
          "You assist a coach. Summarize a prospective client's goals as 2-5 short bullet points and recommend exactly one package from the provided list (use its exact name). Explain why in 1-2 sentences.",
        user: `Packages:\n${data.packages.map((p) => `- ${p.name} (${p.price}): ${p.description}`).join("\n")}\n\nClient notes:\n${data.notes}`,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["goalsSummary", "recommendedPackage", "reason"],
          properties: {
            goalsSummary: { type: "array", items: { type: "string" } },
            recommendedPackage: { type: "string" },
            reason: { type: "string" },
          },
        },
      });
      return { ok: true as const, result };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Something went wrong." };
    }
  });

export interface FollowUpAdvice {
  priority: "high" | "medium" | "low";
  rationale: string;
  nextAction: string;
  suggestedMessage: string;
}

export const recommendFollowUp = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ details: z.string().min(3).max(6000) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const result = await gatewayJson<FollowUpAdvice>({
        name: "follow_up_advice",
        system:
          "You assist a coach with sales follow-up. Given a lead's details, assign a follow-up priority (high, medium or low), explain briefly why, give one concrete next action, and draft a short friendly follow-up message the coach could send.",
        user: `Today is ${new Date().toISOString().slice(0, 10)}.\n\nLead details:\n${data.details}`,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["priority", "rationale", "nextAction", "suggestedMessage"],
          properties: {
            priority: { type: "string", enum: ["high", "medium", "low"] },
            rationale: { type: "string" },
            nextAction: { type: "string" },
            suggestedMessage: { type: "string" },
          },
        },
      });
      return { ok: true as const, result };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Something went wrong." };
    }
  });
