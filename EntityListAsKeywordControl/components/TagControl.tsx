import * as React from "react";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import { TagItem } from "./TagItem";
import { ViewSelector } from "./ViewSelector";
import { ViewInfo } from "../types/ViewInfo";

initializeIcons();

export interface TagRecord {
  id: string;
  label: string;
  tooltipLines: string[];
}

export interface TagControlProps {
  dataset: ComponentFramework.PropertyTypes.DataSet;
  isLoading: boolean;
  isDisabled: boolean;
  availableViews: ViewInfo[];
  currentViewId: string;
  onViewChange: (viewId: string) => void;
  onRecordRemove?: (recordId: string) => void;
}

/**
 * Builds tooltip content from all columns except the first one.
 */
function buildTooltip(
  record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
  columns: ComponentFramework.PropertyHelper.DataSetApi.Column[]
): string {
  const tooltipLines: string[] = [];
  // Skip index 0 (first column = label)
  for (let i = 1; i < columns.length; i++) {
    const col = columns[i];
    const formattedValue = record.getFormattedValue(col.name);
    if (formattedValue !== null && formattedValue !== undefined && formattedValue !== "") {
      tooltipLines.push(`${col.displayName}: ${formattedValue}`);
    }
  }
  return tooltipLines.join("\n");
}

/**
 * Extracts tag records from the PCF dataset.
 */
function extractTags(
  dataset: ComponentFramework.PropertyTypes.DataSet
): TagRecord[] {
  const { sortedRecordIds, records, columns } = dataset;
  if (!sortedRecordIds || sortedRecordIds.length === 0) {
    return [];
  }

  // Sort columns by order (visualSizeFactor-based or use the array index)
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return sortedRecordIds.map((id) => {
    const record = records[id];
    const firstCol = sortedColumns[0];
    const label = firstCol
      ? record.getFormattedValue(firstCol.name) || record.getRecordId()
      : record.getRecordId();
    const tooltipContent = buildTooltip(record, sortedColumns);

    return {
      id: record.getRecordId(),
      label,
      tooltipLines: tooltipContent ? [tooltipContent] : [],
    };
  });
}

export const TagControl: React.FC<TagControlProps> = ({
  dataset,
  isLoading,
  isDisabled,
  availableViews,
  currentViewId,
  onViewChange,
  onRecordRemove,
}) => {
  const tags = React.useMemo(() => extractTags(dataset), [dataset]);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    fontFamily: "Segoe UI, sans-serif",
    padding: "8px",
    boxSizing: "border-box",
  };

  const tagListStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    minHeight: "36px",
    padding: "4px",
    border: "1px solid #E1DFDD",
    borderRadius: "4px",
    backgroundColor: "#FFFFFF",
  };

  const emptyStyle: React.CSSProperties = {
    color: "#605E5C",
    fontSize: "13px",
    padding: "6px",
    fontStyle: "italic",
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <Spinner size={SpinnerSize.medium} label="Loading..." />
      </div>
    );
  }

  if (dataset.error) {
    return (
      <div style={containerStyle}>
        <MessageBar messageBarType={MessageBarType.error}>
          {dataset.errorMessage || "An error occurred loading the data."}
        </MessageBar>
      </div>
    );
  }

  return (
    <div style={containerStyle} role="region" aria-label="Entity Keyword Tags">
      <ViewSelector
        views={availableViews}
        selectedViewId={currentViewId}
        onViewChange={onViewChange}
        disabled={isDisabled}
      />
      <div style={tagListStyle} role="list" aria-label="Tags">
        {tags.length === 0 ? (
          <span style={emptyStyle}>No records found.</span>
        ) : (
          tags.map((tag) => (
            <TagItem
              key={tag.id}
              label={tag.label}
              tooltipContent={
                tag.tooltipLines.length > 0
                  ? tag.tooltipLines.join("\n")
                  : undefined
              }
              onRemove={
                !isDisabled && onRecordRemove
                  ? () => onRecordRemove(tag.id)
                  : undefined
              }
              disabled={isDisabled}
            />
          ))
        )}
      </div>
      {dataset.paging && dataset.paging.totalResultCount > dataset.paging.pageSize && (
        <div style={{ fontSize: "12px", color: "#605E5C", marginTop: "4px" }}>
          Showing {tags.length} of {dataset.paging.totalResultCount} records.
        </div>
      )}
    </div>
  );
};
