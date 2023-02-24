import { Configuration, OpenAIApi } from "openai";
import { createParser } from "eventsource-parser";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const config = {
  runtime: "edge",
};

export default async function (req, res) {
  if (!configuration.apiKey) {
    return new Response("OpenAI API key not configured.", { status: 500 });
  }
  const { microservice } = (await req.json());

  if (typeof microservice !== "string" || microservice.trim().length === 0) {
    return new Response("Please enter a valid microservice.", { status: 400 });
  }

  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let counter = 0;
    const payload = {
        model: "text-davinci-003",
        prompt: generatePrompt(microservice),
        temperature: 0.6,
        stream: true,
        max_tokens: 200,
      }
    const completion = await fetch("https://api.openai.com/v1/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    });

    const stream = new ReadableStream({
      async start(controller) {
        function onParse(event) {
          if (event.type === "event") {
            const data = event.data;
            if (data === "[DONE]") {
              console.log("DONE!: ", data);
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices[0].text;
              if (counter < 2 && (text.match(/\n/) || []).length) {
                return;
              }
              const queue = encoder.encode(text);
              controller.enqueue(queue);
              counter++;
            } catch (e) {
              controller.error(e);
            }
          }
        }

        const parser = createParser(onParse);
        for await (const chunk of completion.body) {
          parser.feed(decoder.decode(chunk));
        }
      },
    });

    return new Response(stream);
  } catch(error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      return new Response(error.response.data, { status: error.response.status });
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      return new Response("An error occurred during your request..", { status: 500 });
    }
  }
}

function generatePrompt(microservice) {
  const capitalizedMicroservice =
    microservice[0].toUpperCase() + microservice.slice(1).toLowerCase();
  return `The following microservice could have been a SQL query? Be imaginative:
  ${capitalizedMicroservice}`;
}
