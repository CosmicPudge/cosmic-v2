export function getAQILabel(aqi: number) {
  switch (aqi) {
    case 1:
      return {
        label: "Good",
        color: "text-green-400",
      };

    case 2:
      return {
        label: "Fair",
        color: "text-lime-400",
      };

    case 3:
      return {
        label: "Moderate",
        color: "text-yellow-400",
      };

    case 4:
      return {
        label: "Poor",
        color: "text-orange-400",
      };

    case 5:
      return {
        label: "Very Poor",
        color: "text-red-500",
      };

    default:
      return {
        label: "Unknown",
        color: "text-white",
      };
  }
}