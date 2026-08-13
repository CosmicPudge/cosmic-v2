import { WeatherEngine } from "@/engines/weather";
import { CalendarEngine } from "@/engines/calendar";
import { GarageEngine } from "@/engines/garage";
import { SportsEngine } from "@/engines/sports";
import { NavigationEngine } from "@/engines/navigation";
import { PresenceEngine } from "@/engines/presence";
import { DayEngine } from "@/engines/day";
import { AssistantEngine } from "@/engines/assistant";
import { modes } from "./modes";
import { TestCalendarProvider } from "@/services/calendar/testCalendarProvider";

class CosmicCore {
  readonly modes = modes;

  readonly weather = new WeatherEngine();

  readonly calendar = new CalendarEngine();

  readonly garage = new GarageEngine();

  readonly sports = new SportsEngine();

  readonly navigation = new NavigationEngine();

  readonly presence = new PresenceEngine();

  readonly day = new DayEngine();

  readonly assistant = new AssistantEngine();

  constructor() {
    this.calendar.setProvider(
      new TestCalendarProvider()
    );

    void this.calendar.initialize();
  }
}

export const cosmic = new CosmicCore();