import { Client } from "@elastic/elasticsearch";
import { Flight } from "../model/flight.model";

export const flightIndex: string = "upcoming-flight-data";
export const client: Client = new Client({
  node: process.env.ELASTIC_ENDPOINT,
  auth: {
    apiKey: process.env.ELASTIC_API_KEY || "",
  },
});

/**
 * Utility to extract flight data from Elasticsearch response
 * @param response 
 * @returns 
 */
export function extractFlights(response: { hits?: { hits?: { _source: Flight }[] } }): Flight[] {
    if (response.hits && Array.isArray(response.hits.hits)) {
        return response.hits.hits.map((hit: { _source: Flight; }) => hit._source);
    }
    return [];
}

/**
 * Get outbound and return flight information for a given destination from Elasticsearch
 * @param destination 
 * @param origin, defaults to London
 * @returns 
 */
export async function getFlights(destination: string, origin: string = "London"): Promise<{ outbound: Flight[]; inbound: Flight[], message: string }> {
    try {
      const responses = await client.msearch({
        searches: [
          { index: flightIndex },
          {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      origin: origin,
                    },
                  },
                  {
                    match: {
                      destination: destination,
                    },
                  },
                ],
              },
            },
          },

          // Return leg
          { index: flightIndex },
          {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      origin: destination,
                    },
                  },
                  {
                    match: {
                      destination: origin,
                    },
                  },
                ],
              },
            },
          },
        ],
      });

      if (responses.responses.length < 2) {
        throw new Error("Unable to obtain flight data");
      }

      return {
        outbound: extractFlights(responses.responses[0] as { hits?: { hits?: { _source: Flight }[] } }),
        inbound: extractFlights(responses.responses[1] as { hits?: { hits?: { _source: Flight }[] } }),
        message: "Success"
      };
    } catch (e) {
      console.error(e);
      return {
        outbound: [],
        inbound: [],
        message: "Unable to obtain flight information"
      };
    }
  }