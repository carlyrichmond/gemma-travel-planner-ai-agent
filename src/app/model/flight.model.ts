export type Flight = {
  origin: Location;
  destination: Location;
  airline: string;
  flight_number: string;
  departure_date: Date;
  currency: string;
  price: number;
};

export type Location =
  | "London"
  | "Glasgow"
  | "Berlin"
  | "Munich"
  | "Dublin"
  | "Barcelona"
  | "Paris"
  | "Mauritius"
  | "Iran"
  | "Madrid"
  | "New York"
  | "Las Vegas"
  | "Seattle"
  | "Prague"
  | "Sao Paulo"
  | "Sydney"
  | "Warsaw";

function priceWithCommas(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatFlight(flight: Flight): string {
  const departureDate = new Date(flight.departure_date);
  return `${flight.airline} ${flight.flight_number} from ${flight.origin} to ${
    flight.destination
  } on ${departureDate.toLocaleDateString()} priced at ${
    flight.currency
  }${priceWithCommas(flight.price)}`;
}
