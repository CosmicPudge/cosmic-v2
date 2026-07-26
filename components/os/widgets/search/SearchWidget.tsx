"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import SearchInput from "./SearchInput";
import SearchSuggestions from "./SearchSuggestions";
import SearchResults from "./SearchResults";
import SearchFooter from "./SearchFooter";

export default function SearchWidget() {
  return (
    <Widget
      accent="search"
    >
      <WidgetHeader
        title="Search"
        subtitle="Find anything"
      />

      <WidgetBody>
        <SearchInput />

        <SearchSuggestions />

        <SearchResults />
      </WidgetBody>

      <WidgetFooter>
        <SearchFooter />
      </WidgetFooter>
    </Widget>
  );
}