
export default async (request) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed." }),
      { status: 405, headers }
    );
  }

  try {
    const { question } = await request.json();

    if (typeof question !== "string" || !question.trim()) {
      return new Response(
        JSON.stringify({ error: "Please enter a question." }),
        { status: 400, headers }
      );
    }

    if (question.length > 4000) {
      return new Response(
        JSON.stringify({ error: "Question is too long." }),
        { status: 400, headers }
      );
    }

    const apiKey = Netlify.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI key is not configured." }),
        { status: 500, headers }
      );
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are Lumaro AI, a friendly study assistant. Answer questions clearly, explain school subjects, summarize notes, and help students learn."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: question.trim() }]
          }],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", response.status);
      return new Response(
        JSON.stringify({
          error: "The AI service couldn't answer. Check the API key and service limits."
        }),
        { status: 502, headers }
      );
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return new Response(
        JSON.stringify({ error: "No answer was returned. Try again." }),
        { status: 502, headers }
      );
    }

    return new Response(
      JSON.stringify({ answer }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Lumaro AI function error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers }
    );
  }
};
