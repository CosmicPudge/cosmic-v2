export function weatherCodeToIcon(code: number): string {
  switch (code) {
    case 0:
      return "01d";

    case 1:
    case 2:
      return "02d";

    case 3:
      return "03d";

    case 45:
    case 48:
      return "50d";

    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
      return "10d";

    case 71:
    case 73:
    case 75:
      return "13d";

    case 95:
      return "11d";

    default:
      return "01d";
  }
}