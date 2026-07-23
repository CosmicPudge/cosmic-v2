import { Provider } from "./Provider";
import { Intelligence } from "./Intelligence";
import { Widget } from "./Widget";
import { Action } from "./Action";
import { Route } from "./Route";

export interface CosmicSystem {
  id: string;
  name: string;
  version: string;
  description?: string;

  providers: Provider[];
  intelligence: Intelligence;

  widgets: Widget[];
  actions: Action[];
  routes: Route[];
}
