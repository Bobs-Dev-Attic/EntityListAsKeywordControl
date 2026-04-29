import * as React from "react";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { Text } from "@fluentui/react/lib/Text";
import { getTheme } from "@fluentui/react/lib/Styling";
import { TagItem } from "./TagItem";
import { ViewSelector } from "./ViewSelector";
import { ViewInfo } from "../types/ViewInfo";

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
  tagBackgroundColor?: string;
  tagBorderColor?: string;
  tagTextColor?: string;
  showTooltips: boolean;
  tooltipMaxLines: number;
  tooltipFieldName?: string;
  tooltipCustomContent?: string;
  tooltipContentMode: "text" | "html";
}

/**
 * Builds tooltip content from all columns except the first one.
 */
function buildTooltipLines(
  record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
  columns: ComponentFramework.PropertyHelper.DataSetApi.Column[]
): string[] {
  const tooltipLines: string[] = [];
  // Skip index 0 (first column = label)
  for (let i = 1; i < columns.length; i++) {
    const col = columns[i];
    const formattedValue = record.getFormattedValue(col.name);
    if (formattedValue !== null && formattedValue !== undefined && formattedValue !== "") {
      tooltipLines.push(`${col.displayName}: ${formattedValue}`);
    }
  }
  return tooltipLines;
}

/**
 * Extracts tag records from the PCF dataset.
 */
function extractTags(
  dataset: ComponentFramework.PropertyTypes.DataSet,
  tooltipFieldName?: string,
  tooltipCustomContent?: string
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
    const tooltipLines = buildTooltipLines(record, sortedColumns);
    if (tooltipFieldName) {
      const tooltipFieldValue = record.getFormattedValue(tooltipFieldName);
      if (tooltipFieldValue) {
        tooltipLines.unshift(tooltipFieldValue);
      }
    }
    if (tooltipCustomContent) {
      tooltipLines.push(tooltipCustomContent);
    }

    return {
      id: record.getRecordId(),
      label,
      tooltipLines,
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
  tagBackgroundColor,
  tagBorderColor,
  tagTextColor,
  showTooltips,
  tooltipMaxLines,
  tooltipFieldName,
  tooltipCustomContent,
  tooltipContentMode,
}) => {
  const theme = getTheme();
  const tags = React.useMemo(
    () => extractTags(dataset, tooltipFieldName, tooltipCustomContent),
    [dataset.sortedRecordIds, dataset.records, dataset.columns, tooltipFieldName, tooltipCustomContent]
  );

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    fontFamily: "Segoe UI, sans-serif",
    padding: "12px",
    boxSizing: "border-box",
  };

  const tagListStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    minHeight: "36px",
    padding: "4px",
    border: `1px solid ${theme.semanticColors.inputBorder}`,
    borderRadius: "4px",
    backgroundColor: theme.semanticColors.bodyBackground,
  };

  const emptyStyle: React.CSSProperties = {
    color: theme.semanticColors.bodySubtext,
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
      <div style={tagListStyle} role="list" aria-label="Keyword tags">
        {tags.length === 0 ? (
          <span style={emptyStyle}>No records found.</span>
        ) : (
          tags.map((tag) => (
            <TagItem
              key={tag.id}
              label={tag.label}
              tooltipContent={
                showTooltips && tag.tooltipLines.length > 0
                  ? tag.tooltipLines.slice(0, tooltipMaxLines).join("\n")
                  : undefined
              }
              tooltipMode={tooltipContentMode}
              onRemove={
                !isDisabled && onRecordRemove
                  ? () => onRecordRemove(tag.id)
                  : undefined
              }
              disabled={isDisabled}
              tagBackgroundColor={tagBackgroundColor}
              tagBorderColor={tagBorderColor}
              tagTextColor={tagTextColor}
            />
          ))
        )}
      </div>
      {dataset.paging && dataset.paging.totalResultCount > dataset.paging.pageSize && (
        <Text variant="small" styles={{ root: { color: theme.semanticColors.bodySubtext, marginTop: "6px" } }}>
          Showing {tags.length} of {dataset.paging.totalResultCount} records.
        </Text>
      )}
    </div>
  );
};
