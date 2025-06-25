// bramble_prompt_worker.js

const GITHUB_BASE = "https://raw.githubusercontent.com/DJGRIMES/bramble-ai-form-site/main/";

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    }

    let formInput;
    try {
      formInput = await request.json();
      console.log("Form input received:", formInput);
    } catch (err) {
      return new Response(JSON.stringify({ error: `Invalid JSON: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    }

    try {
      const context = await loadPromptContext();
      console.log("Prompt context loaded.");

      const system = await generateSystemPrompt(context, env);
      console.log("System prompt generated.", system);

      const user = await generateUserPrompt(formInput, context, env);
      console.log("User prompt generated.", user);

      const promptPair = { system, user };
      const finalOutput = await generateFinalResponse(promptPair, env);
      console.log("Final response generated.");

      return new Response(JSON.stringify({
        result: finalOutput,
        promptUsed: promptPair
      }), {
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("Error during processing:", err);
      return new Response(JSON.stringify({ error: `Processing failed: ${err.message}` }), {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return await res.json();
}

async function loadPromptContext() {
  const [tone, values, tech, meta] = await Promise.all([
    fetchJSON(GITHUB_BASE + "settings-tone.json"),
    fetchJSON(GITHUB_BASE + "settings-values.json"),
    fetchJSON(GITHUB_BASE + "settings-tech.json"),
    fetchJSON(GITHUB_BASE + "prompt-meta.json")
  ]);
  return { tone, values, tech, meta };
}

async function generateSystemPrompt(context, env) {
  const messages = [
    {
      role: "system",
      content: "You are crafting a system prompt for an assistant that guides small businesses using Bramble Works' philosophy."
    },
    {
      role: "user",
      content: `Tone: ${JSON.stringify(context.tone)}\nValues: ${JSON.stringify(context.values)}\nPreferred Tools: ${JSON.stringify(context.tech)}`
    }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages
    })
  });

  const result = await response.json();
  return result.choices?.[0]?.message?.content?.trim();
}

async function generateUserPrompt(formInput, context, env) {
  const messages = [
    {
      role: "system",
      content: "You are writing a user prompt that shares business context in a friendly, clear tone."
    },
    {
      role: "user",
      content: `Business Input: ${JSON.stringify(formInput, null, 2)}\nTone Guide: ${JSON.stringify(context.tone)}\nEmphasize clarity and approachability.`
    }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages
    })
  });

  const result = await response.json();
  return result.choices?.[0]?.message?.content?.trim();
}

async function generateFinalResponse(promptPair, env) {
  const messages = [
    { role: "system", content: promptPair.system },
    { role: "user", content: promptPair.user }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages
    })
  });

  const result = await response.json();
  return result.choices?.[0]?.message?.content || "[No response generated]";
}
