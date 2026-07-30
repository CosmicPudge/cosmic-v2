import type { WidgetFootprint } from "@/apps/core";

export type { WidgetFootprint };

export type WidgetRows = WidgetFootprint["rows"];

export type WidgetColumns = WidgetFootprint["cols"];

export interface FootprintPickerProps {
  value: WidgetFootprint;

  onChange(
    footprint: WidgetFootprint
  ): void;
}

export interface FootprintCellProps {
  row: WidgetRows;
  col: WidgetColumns;

  active: boolean;

  onHover(
    row: WidgetRows,
    col: WidgetColumns
  ): void;

  onSelect(
    row: WidgetRows,
    col: WidgetColumns
  ): void;
}
