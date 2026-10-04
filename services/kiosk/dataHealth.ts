export interface KioskDataHealthShape {
  weather: unknown;
  calendar?: { connected?: boolean };
  school?: { connected?: boolean };
}

export function classifyKioskDataHealth(value: KioskDataHealthShape) {
  return {
    weather: value.weather !== null && value.weather !== undefined,
    calendar: value.calendar?.connected === true,
    school: value.school?.connected === true,
  };
}
