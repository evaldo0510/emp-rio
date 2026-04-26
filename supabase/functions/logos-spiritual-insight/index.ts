import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SUPPORTED_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.0-pro",
];

const DEFAULT_MODEL = "gemini-1.5-flash";
const FALLBACK_MODEL = "gemini-1.5-pro";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info",
};

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, model = DEFAULT_MODEL } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validation of model
    if (!SUPPORTED_MODELS.includes(model)) {
      console.warn(`Model ${model} is not in the official supported list.`);
    }

    console.log(`Generating logo insight for prompt: "${prompt}" using model: ${model}`);

    const callAI = async (selectedModel: string) => {
      console.log(`Calling AI Gateway with model: ${selectedModel}`);
      const response = await fetch("https://api.lovable.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content:
                "Você é um especialista em branding e design espiritual. Gere uma descrição detalhada e insights para um logo baseado no prompt do usuário. Retorne um JSON com 'description', 'colors', 'symbols' e 'rationale'.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`AI Gateway error (Status ${response.status}):`, errorData);
        throw new Error(`AI Gateway error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    };

    let result;
    try {
      result = await callAI(model);
    } catch (err: any) {
      console.error(`Primary model ${model} failed. Attempting fallback to ${FALLBACK_MODEL}...`);
      try {
        result = await callAI(FALLBACK_MODEL);
      } catch (fallbackErr: any) {
        console.error(`Fallback model ${FALLBACK_MODEL} also failed.`);
        return new Response(
          JSON.stringify({
            error: "Geração de logo falhou em todos os modelos.",
            details: err.message,
            fallback_details: fallbackErr.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: err.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
}

if (import.meta.main) {
  serve(handler);
}
