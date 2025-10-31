import { ollama } from "ollama-ai-provider-v2";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";

import { getFlights } from "@/app/util/elasticsearch";
import { formatFlight } from "@/app/model/flight.model";

// Allow streaming responses up to 30 seconds to address typically longer responses from LLMs
export const maxDuration = 30;

// Post request handler
export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get flight information, assuming prompt starts with destination (not ideal)
  const destination = messages[0].parts[0].text.split(" ")[0];
  const flights = await getFlights(destination);

  let prompt = `You are a helpful assistant that returns travel itineraries based on location, 
        the FCDO guidance from the UK government, and the weather around that the specified 
        time of year (if provided). Return an itinerary of sites to see and things to do 
        based on the weather. 
        If the FCDO warns against travel DO NOT generate an itinerary.`

  if (flights.outbound.length > 0 && flights.inbound.length > 0) { 
    prompt = `${prompt}
    Include the following flight options: 
        outbound: ${formatFlight(flights.outbound[0])}
        inbound: ${formatFlight(flights.inbound[0])}`;
    }

  try {
    const convertedMessages = convertToModelMessages(messages);
    const result = streamText({
      model: ollama("gemma3:1b"),
      system: prompt,
      messages: convertedMessages,
      stopWhen: stepCountIs(2),
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
