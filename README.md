# Bramble AI Form Site

A Cloudflare Workers application that collects small‑business context through a web form and generates a custom “tech strategy” plan using OpenAI’s API.

## Features
- **Interactive HTML form** for capturing business challenges and goals, then posting them to the worker endpoint
- **Cloudflare Worker** that validates input, loads tone/values/tech settings from this repository, and orchestrates a prompt pair plus final AI response using `gpt-4o`
- **Configuration files** defining voice, values, tech preferences, and prompt metadata used to guide prompt generation (`settings-tone.json`, `settings-values.json`, `settings-tech.json`, `prompt-meta.json`)
- **Vitest test harness** (currently populated with placeholder “Hello World” tests) to illustrate how Cloudflare Worker code can be tested locally

## Project Structure
```
.
├── index.html            # Web form UI and client-side fetch logic
├── src/index.js          # Cloudflare Worker entrypoint
├── settings-tone.json    # Tone guidance for generated prompts
├── settings-values.json  # Core philosophy and values
├── settings-tech.json    # Preferred tooling list
├── prompt-meta.json      # Prompt generation rules and format
├── test/index.spec.js    # Sample Vitest tests for the worker
└── package.json          # Scripts and dev dependencies
```

## Getting Started
1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set environment variables**

   - `OPENAI_API_KEY`: OpenAI key used by the worker to call `chat/completions`

3. **Run in development**

   ```bash
   npm start
   ```
   Uses `wrangler dev` for local Cloudflare Worker execution

4. **Run tests**

   ```bash
   npm test
   ```
   Executes Vitest with the Cloudflare worker test pool

5. **Deploy**

   ```bash
   npm run deploy
   ```
   Deploys the worker via Wrangler

## API

`POST` requests to the worker should send a JSON body with the fields collected in `index.html`.
Successful responses return:

```json
{
  "result": "<tech strategy text>",
  "promptUsed": {
    "system": "<system prompt>",
    "user": "<user prompt>"
  }
}
```

Errors include a descriptive `error` property and appropriate status codes.

