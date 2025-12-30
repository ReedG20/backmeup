import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateText } from "npm:ai@4";
import { createOpenRouter } from "npm:@openrouter/ai-sdk-provider@0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Turn {
  id: string;
  transcript: string;
  turn_order: number;
  created_at: string;
}

interface Insight {
  id: string;
  title: string;
  notification_body: string;
  expanded_body: string;
  trigger_turn_id: string;
  created_at: string;
}

interface RouterResponse {
  should_generate: boolean;
  reason: string;
}

interface InsightResponse {
  title: string;
  notification_body: string;
  expanded_body: string;
}

const CONTEXT_WINDOW_SIZE = 16;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_id, trigger_turn_id } = await req.json();

    if (!session_id || !trigger_turn_id) {
      return new Response(
        JSON.stringify({ error: "session_id and trigger_turn_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize OpenRouter
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openrouter = createOpenRouter({ apiKey: openrouterApiKey });

    // Fetch last N turns ordered by turn_order
    const { data: turns, error: turnsError } = await supabase
      .from("turns")
      .select("id, transcript, turn_order, created_at")
      .eq("session_id", session_id)
      .order("turn_order", { ascending: false })
      .limit(CONTEXT_WINDOW_SIZE);

    if (turnsError) {
      console.error("Error fetching turns:", turnsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch turns" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!turns || turns.length === 0) {
      return new Response(
        JSON.stringify({ insight: null, reason: "No turns found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reverse to get chronological order
    const chronologicalTurns = (turns as Turn[]).reverse();

    // Get the turn IDs in our context window
    const turnIds = chronologicalTurns.map((t) => t.id);

    // Fetch existing insights that were triggered by turns in our context window
    const { data: existingInsights, error: insightsError } = await supabase
      .from("insights")
      .select("id, title, notification_body, expanded_body, trigger_turn_id, created_at")
      .eq("session_id", session_id)
      .in("trigger_turn_id", turnIds)
      .order("created_at", { ascending: true });

    if (insightsError) {
      console.error("Error fetching insights:", insightsError);
      // Continue without existing insights
    }

    const insights = (existingInsights as Insight[]) || [];

    // Build context string for the AI
    const contextParts: string[] = [];

    // Add turns with their order
    contextParts.push("=== CONVERSATION TRANSCRIPT ===");
    for (const turn of chronologicalTurns) {
      contextParts.push(`[Turn ${turn.turn_order}]: ${turn.transcript}`);
    }

    // Add existing insights if any
    if (insights.length > 0) {
      contextParts.push("\n=== PREVIOUSLY GENERATED INSIGHTS ===");
      for (const insight of insights) {
        contextParts.push(`[Insight] ${insight.title}: ${insight.notification_body}`);
      }
    }

    const contextString = contextParts.join("\n");

    // Stage 1: Router model decides if we should generate an insight
    console.log("Calling router model...");
    const routerResult = await generateText({
      model: openrouter("google/gemini-2.5-flash-lite"),
      system: `You are a router that decides if there's enough new conversational material to warrant generating a fact-check or argument analysis insight.

You are helping a user who is in a debate, argument, or heated discussion. They want to be supported with facts, counterarguments, and logical analysis - but only when there's meaningful new material to analyze.

Consider:
- Has a significant factual claim been made that could be verified?
- Has an argument been presented that could be countered or strengthened?
- Is there new substantive content since the last insight was generated?
- Would an insight at this point be helpful or would it be too soon / redundant?

If there are already insights shown, be more selective - only trigger new ones when truly valuable new content has appeared.

Respond with ONLY a JSON object in this exact format:
{"should_generate": true/false, "reason": "brief explanation"}`,
      prompt: `Based on this conversation context, should we generate a new insight?\n\n${contextString}`,
      temperature: 0.3,
    });

    let routerResponse: RouterResponse;
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      let jsonText = routerResult.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      }
      routerResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse router response:", routerResult.text);
      return new Response(
        JSON.stringify({ insight: null, reason: "Router response parse error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Router decision:", routerResponse);

    if (!routerResponse.should_generate) {
      return new Response(
        JSON.stringify({ insight: null, reason: routerResponse.reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stage 2: Research model generates the insight
    console.log("Calling research model...");
    const insightResult = await generateText({
      model: openrouter("perplexity/sonar"),
      system: `You are a discreet debate assistant helping someone in a real-time argument or discussion. Your job is to provide quick, actionable insights that give them an edge.

Generate an insight based on the conversation. The insight should be one of:
- A fact-check of a claim made (with sources if possible)
- A counterargument to a point made by the other party
- A supporting argument/evidence for the user's position
- A logical fallacy identification
- Relevant context or background information

Keep it concise and immediately useful. The user needs to quickly glance at this and get value.

Respond with ONLY a JSON object in this exact format:
{
  "title": "Short, punchy title (max 50 chars)",
  "notification_body": "One sentence summary for notification (max 100 chars)", 
  "expanded_body": "Full insight with details, sources, and actionable points (2-4 paragraphs, markdown supported)"
}`,
      prompt: `Generate a helpful insight for this conversation:\n\n${contextString}`,
      temperature: 0.5,
    });

    let insightResponse: InsightResponse;
    try {
      let jsonText = insightResult.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      }
      insightResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse insight response:", insightResult.text);
      return new Response(
        JSON.stringify({ insight: null, reason: "Insight response parse error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save the insight to the database
    const { data: savedInsight, error: saveError } = await supabase
      .from("insights")
      .insert({
        session_id,
        trigger_turn_id,
        title: insightResponse.title,
        notification_body: insightResponse.notification_body,
        expanded_body: insightResponse.expanded_body,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving insight:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save insight" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Insight saved:", savedInsight.id);

    return new Response(
      JSON.stringify({ insight: savedInsight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

