#!/bin/bash

set -e

echo "🚀 Bootstrapping Cosmic SDK..."

# Create directories
mkdir -p core/sdk
mkdir -p core/registry

########################################
# SDK
########################################

cat > core/sdk/Provider.ts <<'EOF'
export interface Provider {
  id: string;

  connect(): Promise<void>;
  refresh(): Promise<void>;
  disconnect(): Promise<void>;
}
EOF

cat > core/sdk/Intelligence.ts <<'EOF'
export interface Intelligence {
  summarize(): Promise<unknown>;
  getContext(): Promise<unknown>;
  getMission(): Promise<unknown>;
  getRecommendations(): Promise<unknown>;
}
EOF

cat > core/sdk/Widget.ts <<'EOF'
import { ComponentType } from "react";

export interface Widget {
  id: string;
  title: string;
  size: "small" | "medium" | "large";
  component: ComponentType;
}
EOF

cat > core/sdk/Action.ts <<'EOF'
export interface Action {
  id: string;
  name: string;

  execute(): Promise<void>;
}
EOF

cat > core/sdk/Route.ts <<'EOF'
import { ComponentType } from "react";

export interface Route {
  path: string;
  component: ComponentType;
}
EOF

cat > core/sdk/CosmicSystem.ts <<'EOF'
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
EOF

cat > core/sdk/index.ts <<'EOF'
export * from "./Provider";
export * from "./Intelligence";
export * from "./Widget";
export * from "./Action";
export * from "./Route";
export * from "./CosmicSystem";
EOF

########################################
# Registry
########################################

cat > core/registry/types.ts <<'EOF'
export interface RegistryStats {
  systems: number;
}
EOF

cat > core/registry/CosmicRegistry.ts <<'EOF'
import { CosmicSystem } from "../sdk";

class CosmicRegistry {

  private systems = new Map<string, CosmicSystem>();

  register(system: CosmicSystem) {

    if (this.systems.has(system.id)) {
      throw new Error(`System "${system.id}" already registered.`);
    }

    this.systems.set(system.id, system);
  }

  getSystems(): CosmicSystem[] {
    return [...this.systems.values()];
  }

  getSystem(id: string) {
    return this.systems.get(id);
  }

  clear() {
    this.systems.clear();
  }

}

export const registry = new CosmicRegistry();
EOF

cat > core/registry/registerSystem.ts <<'EOF'
import { CosmicSystem } from "../sdk";
import { registry } from "./CosmicRegistry";

export function registerSystem(system: CosmicSystem) {
  registry.register(system);
}
EOF

cat > core/registry/loadSystems.ts <<'EOF'
// TODO
// Automatically load systems in the future.
EOF

cat > core/registry/discoverWidgets.ts <<'EOF'
// TODO
// Aggregate widgets from all registered systems.
EOF

cat > core/registry/discoverActions.ts <<'EOF'
// TODO
// Aggregate actions from all registered systems.
EOF

cat > core/registry/discoverProviders.ts <<'EOF'
// TODO
// Aggregate providers from all registered systems.
EOF

cat > core/registry/discoverRoutes.ts <<'EOF'
// TODO
// Aggregate routes from all registered systems.
EOF

echo ""
echo "✅ Cosmic SDK bootstrapped!"
echo ""
echo "Created:"
echo "  core/sdk/"
echo "  core/registry/"
echo ""
echo "Ready for Milestone 2 🚀"