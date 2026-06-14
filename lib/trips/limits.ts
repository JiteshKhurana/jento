export const MAX_TRIPS_PER_USER = 10;

export function getTripLimitMessage() {
  return `You've reached the ${MAX_TRIPS_PER_USER} trip limit. Delete an existing trip to create a new one.`;
}

export async function getCreateTripErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // ignore parse errors
  }
  return "Failed to create trip";
}
