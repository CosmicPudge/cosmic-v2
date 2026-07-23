import { ComponentType } from "react";

export interface Widget {
  id: string;
  title: string;
  size: "small" | "medium" | "large";
  component: ComponentType;
}
