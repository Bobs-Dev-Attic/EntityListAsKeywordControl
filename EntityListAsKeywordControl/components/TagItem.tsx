import * as React from "react";
import { TooltipHost, ITooltipHostStyles } from "@fluentui/react/lib/Tooltip";
import { Icon } from "@fluentui/react/lib/Icon";

export interface TagItemProps {
  label: string;
  tooltipContent?: string;
  onRemove?: () => void;
  disabled?: boolean;
}

const tooltipHostStyles: Partial<ITooltipHostStyles> = {
  root: { display: "inline-block" },
};

export const TagItem: React.FC<TagItemProps> = ({
  label,
  tooltipContent,
  onRemove,
  disabled,
}) => {
  const tagStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#EFF6FC",
    border: "1px solid #C7E0F4",
    borderRadius: "16px",
    padding: "4px 10px",
    margin: "4px",
    fontSize: "13px",
    color: "#005A9E",
    fontFamily: "Segoe UI, sans-serif",
    maxWidth: "240px",
    cursor: "default",
    transition: "background-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "180px",
  };

  const removeButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    color: "#605E5C",
    flexShrink: 0,
    background: "none",
    border: "none",
    padding: "0",
    lineHeight: 1,
  };

  const tagContent = (
    <div style={tagStyle} role="listitem">
      <span style={labelStyle} title={!tooltipContent ? label : undefined}>
        {label}
      </span>
      {!disabled && onRemove && (
        <button
          style={removeButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label}`}
          title={`Remove ${label}`}
        >
          <Icon iconName="Cancel" style={{ fontSize: "10px" }} />
        </button>
      )}
    </div>
  );

  if (tooltipContent) {
    return (
      <TooltipHost
        content={tooltipContent}
        styles={tooltipHostStyles}
        calloutProps={{ gapSpace: 4 }}
      >
        {tagContent}
      </TooltipHost>
    );
  }

  return tagContent;
};
