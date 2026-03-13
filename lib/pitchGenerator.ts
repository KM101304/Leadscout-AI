import OpenAI from "openai";
import { env } from "@/lib/env";
import { IssueType, PitchBundle } from "@/lib/types";

const readableIssue: Record<IssueType, string> = {
  "no-website": "you do not have a strong website presence",
  "outdated-site": "your site appears dated",
  "poor-mobile": "mobile visitors may have a rough experience",
  "no-booking": "there is no clear booking or conversion flow",
  "no-ssl": "the site does not appear to use SSL",
  "low-reviews": "your review momentum looks light",
  "broken-links": "a few pages appear to be broken",
  "no-chat-widget": "there is no real-time chat or AI assistant",
  "no-analytics": "visitor tracking looks limited",
  "slow-site": "pages seem slower than ideal",
  "weak-seo": "the site is missing basic SEO elements"
};

export async function generatePitch(input: {
  businessName: string;
  websiteUrl: string;
  issues: IssueType[];
  industry: string;
}): Promise<PitchBundle> {
  if (env.openAiApiKey) {
    const generated = await generatePitchWithOpenAI(input);
    if (generated) {
      return generated;
    }
  }

  return generateFallbackPitch(input);
}

function generateFallbackPitch(input: {
  businessName: string;
  websiteUrl: string;
  issues: IssueType[];
  industry: string;
}): PitchBundle {
  const issueSummary = input.issues.slice(0, 2).map((issue) => readableIssue[issue]).join(" and ");

  return {
    coldCallOpener: `I was looking at ${input.businessName} and noticed ${issueSummary || "a few digital gaps"} that could be costing ${input.industry} leads. We help teams fix those quickly.`,
    emailPitch: `Hi, I took a quick look at ${input.websiteUrl || input.businessName} and found a few conversion gaps that likely make it harder for new ${input.industry} customers to reach you. We help local businesses tighten booking, trust, and follow-up systems without a full rebuild when it is not needed.`,
    serviceSuggestion: suggestService(input.issues)
  };
}

async function generatePitchWithOpenAI(input: {
  businessName: string;
  websiteUrl: string;
  issues: IssueType[];
  industry: string;
}): Promise<PitchBundle | null> {
  try {
    const client = new OpenAI({ apiKey: env.openAiApiKey });
    const response = await client.responses.create({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content:
            "You write concise outbound prospecting copy for agencies. Return JSON with keys coldCallOpener, emailPitch, serviceSuggestion."
        },
        {
          role: "user",
          content: `Business: ${input.businessName}
Website: ${input.websiteUrl}
Industry: ${input.industry}
Detected issues: ${input.issues.join(", ")}

Make the copy practical, specific, and under 90 words per field.`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "lead_pitch",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              coldCallOpener: { type: "string" },
              emailPitch: { type: "string" },
              serviceSuggestion: { type: "string" }
            },
            required: ["coldCallOpener", "emailPitch", "serviceSuggestion"]
          }
        }
      }
    });

    const output = response.output_text;
    if (!output) {
      return null;
    }

    const parsed = JSON.parse(output) as PitchBundle;
    if (!parsed.coldCallOpener || !parsed.emailPitch || !parsed.serviceSuggestion) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function suggestService(issues: IssueType[]) {
  if (issues.includes("no-booking")) return "Booking flow automation + follow-up sequences";
  if (issues.includes("no-chat-widget")) return "Website modernization + AI chatbot";
  if (issues.includes("weak-seo")) return "SEO refresh + local landing page optimization";
  if (issues.includes("low-reviews")) return "Reputation management system";
  return "Website modernization + conversion funnel cleanup";
}
