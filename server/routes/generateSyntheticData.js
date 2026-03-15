const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

const SYSTEM_PROMPT = `You are a synthetic data generator for software testing environments.
Given a database schema, a user role, a short scenario description, and pre-assigned test credentials, generate realistic synthetic test data that:
- Matches the exact structure and field names of the provided schema
- Is appropriate for the given user role (e.g. admin sees more data, user sees their own records only)
- Reflects the scenario described by the user
- Inserts the provided test credentials into the appropriate users/accounts table rows — do not invent different emails or passwords
- Uses plausible fake names, emails, numbers, and dates for all other records — never real personal data
- Returns ONLY a valid JSON object with no explanation, no markdown, no code fences
- Make sure to add required credentials into the user ir equivalent table so user can login.
Example: I am a student wanting to enrol in a webinar but the seats are full, in this case it is your responsiblity that:
1. Student credentials can log in to the scenario and see student view.
2. A webinar should be present in the webinar table with a date in the future and a capacity of 0 (full).`;

router.post("/", async (req, res) => {
  const { prompt, role, dbSchema, roleCredentials } = req.body;

  if (!prompt || !role || !dbSchema) {
    return res.status(400).json({ error: "prompt, role, and dbSchema are required" });
  }

  if (prompt.length > 50) {
    return res.status(400).json({ error: "prompt must be 50 characters or less" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  const openai = new OpenAI({ apiKey });

  const credentialsSection = roleCredentials && Object.keys(roleCredentials).length > 0
    ? `\nPre-assigned test credentials (use these exact values in the users table):\n${
        Object.entries(roleCredentials)
          .map(([r, c]) => `  ${r}: email=${c.email}, password=${c.password}`)
          .join("\n")
      }`
    : "";

  const userMessage = `
Scenario: ${prompt}
Role: ${role}
Database Schema:
${JSON.stringify(dbSchema, null, 2)}${credentialsSection}
  `.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content;
    const syntheticData = JSON.parse(raw);

    res.json({ syntheticData });
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.status(500).json({ error: "Failed to generate synthetic data", detail: err.message });
  }
});

module.exports = router;
