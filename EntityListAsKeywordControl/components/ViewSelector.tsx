import * as React from "react";
import {
  Dropdown,
  IDropdownOption,
  IDropdownStyles,
} from "@fluentui/react/lib/Dropdown";
import { Label } from "@fluentui/react/lib/Label";
import { ViewInfo } from "../types/ViewInfo";

export interface ViewSelectorProps {
  views: ViewInfo[];
  selectedViewId: string;
  onViewChange: (viewId: string) => void;
  disabled?: boolean;
}

const dropdownStyles: Partial<IDropdownStyles> = {
  dropdown: { width: 240 },
  root: { display: "flex", alignItems: "center", gap: "8px" },
};

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  views,
  selectedViewId,
  onViewChange,
  disabled,
}) => {
  const options: IDropdownOption[] = views.map((view) => ({
    key: view.id,
    text: view.name,
  }));

  const handleChange = (
    _event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption
  ): void => {
    if (option) {
      onViewChange(option.key as string);
    }
  };

  if (options.length <= 1) {
    return null;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
      <Label>View:</Label>
      <Dropdown
        options={options}
        selectedKey={selectedViewId}
        onChange={handleChange}
        disabled={disabled}
        styles={dropdownStyles}
        aria-label="Select a view"
      />
    </div>
  );
};
