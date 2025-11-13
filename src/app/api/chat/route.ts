import { ollama } from "ollama-ai-provider-v2";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";

import { weatherTool } from "@/app/ai/weather.tool";
import { fcdoTool } from "@/app/ai/fcdo.tool";
import { flightTool } from "@/app/ai/flights.tool";

// Allow streaming responses up to 30 seconds to address typically longer responses from LLMs
export const maxDuration = 30;

const tools = {
  flights: flightTool,
  weather: weatherTool,
  fcdo: fcdoTool,
};

// Post request handler
export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const convertedMessages = convertToModelMessages(messages);
    const result = streamText({
      model: ollama("PetrosStav/gemma3-tools:4b"),
      system:
        "You are a helpful assistant that returns travel itineraries based on location, the FCDO guidance from the specified tool, and the weather captured from the displayWeather tool." +
        "You must obtain both the weather and FCDO guidance from the respective tools before generating the itinerary." +
        "Use the flight information from tool getFlights only to recommend possible flights in the itinerary." +
        "If there are no flights available generate a sample itinerary and advise them to contact a travel agent." +
        "Always return an itinerary of sites to see and things to do based on both the weather and FCDO guidance." + 
        "Generate an itinerary without asking for more information from the user." +
        "If the FCDO tool warns against travel, advise the user you cannot generate an itinerary.",
      messages: convertedMessages,
      stopWhen: stepCountIs(2),
      tools,
    });

    // Return data stream to allow the useChat hook to handle the results as they are streamed through for a better user experience
    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error(e);
    return new NextResponse(
      "Unable to generate a plan. Please try again later!"
    );
  }
}
