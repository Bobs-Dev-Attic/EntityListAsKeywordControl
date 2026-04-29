import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import { TagControl } from "./components/TagControl";
import { ViewInfo } from "./types/ViewInfo";

let iconsInitialized = false;
// ^ Module-level flag: when multiple control instances are on one form, we only initialize once.

export class EntityListAsKeywordControl
  implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
  private _context!: ComponentFramework.Context<IInputs>;
  private _notifyOutputChanged!: () => void;
  private _availableViews: ViewInfo[];
  private _currentViewId: string;
  private _isDestroyed: boolean;

  constructor() {
    this._availableViews = [];
    this._currentViewId = "";
    this._isDestroyed = false;
  }

  /**
   * Used to initialize the control instance. Controls can kick off remote server calls
   * and other initialization actions here. Data-set values are not initialized here,
   * use updateView.
   * @param context The entire property bag available to control via Context Object; It contains
   * values as set up by the customizer mapped to property names defined in the manifest, as well as
   * utility functions.
   * @param notifyOutputChanged A callback method to alert the framework that the control has new
   * outputs ready to be retrieved asynchronously.
   * @param state A piece of data that persists in one session for a single user. Can be set at any
   * point in a control's life cycle by calling 'setControlState' in the Mode interface.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary
  ): void {
    if (!iconsInitialized) {
      initializeIcons();
      iconsInitialized = true;
    }

    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
    this._currentViewId = context.parameters.sampleDataSet.getViewId();

    // Enable paging and load data
    context.parameters.sampleDataSet.paging.setPageSize(250);

    // Load available views for the entity asynchronously
    this._loadAvailableViews(context);
  }

  /**
   * Called when any value in the property bag has changed. This includes field values,
   * data-sets, global values such as container height and width, offline status, control
   * metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains
   * values as set up by the customizer mapped to names defined in the manifest, as well as
   * utility functions
   * @returns ReactElement root react element for the control
   */
  public updateView(
    context: ComponentFramework.Context<IInputs>
  ): React.ReactElement {
    this._context = context;

    const props = {
      dataset: context.parameters.sampleDataSet,
      isLoading: context.parameters.sampleDataSet.loading,
      isDisabled: context.mode.isControlDisabled,
      availableViews: this._availableViews,
      currentViewId: this._currentViewId,
      onViewChange: this._handleViewChange,
      onRecordRemove: context.mode.isControlDisabled
        ? undefined
        : this._handleRecordRemove,
      tagBackgroundColor: context.parameters.tagBackgroundColor.raw || undefined,
      tagBorderColor: context.parameters.tagBorderColor.raw || undefined,
      tagTextColor: context.parameters.tagTextColor.raw || undefined,
      // If maker leaves these empty, we fall back to practical defaults.
      showTooltips: context.parameters.showTooltips.raw ?? true,
      // Guard lower bound so a misconfigured value never hides all tooltip content.
      tooltipMaxLines: Math.max(1, context.parameters.tooltipMaxLines.raw ?? 8),
      tooltipFieldName: context.parameters.tooltipFieldName.raw || undefined,
      tooltipCustomContent: context.parameters.tooltipCustomContent.raw || undefined,
      tooltipContentMode:
        context.parameters.tooltipContentMode.raw?.toLowerCase() === "html"
          ? ("html" as const)
          : ("text" as const),
    };

    return React.createElement(TagControl, props);
  }

  /**
   * It is called by the framework prior to a control receiving new data.
   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property
   * marked as "bound" or "output"
   */
  public getOutputs(): IOutputs {
    return {};
  }

  /**
   * Called when the control is to be removed from the DOM tree. Controls should use this call
   * for cleanup (e.g. cancelling asynchronous requests or removing event listeners).
   */
  public destroy(): void {
    this._isDestroyed = true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Loads available public and personal views for the target entity via the WebAPI.
   */
  private async _loadAvailableViews(
    context: ComponentFramework.Context<IInputs>
  ): Promise<void> {
    try {
      const dataset = context.parameters.sampleDataSet;
      const entityType = dataset.getTargetEntityType();

      if (!entityType) {
        return;
      }

      const escapedEntityType = entityType.replace(/'/g, "''");

      // Fetch system views (savedquery) for the entity type
      const systemViewsResult = await context.webAPI.retrieveMultipleRecords(
        "savedquery",
        `?$select=savedqueryid,name&$filter=returnedtypecode eq '${escapedEntityType}' and statecode eq 0 and querytype eq 0&$orderby=name asc`
      );

      // Fetch personal views (userquery) for the entity type
      const personalViewsResult = await context.webAPI.retrieveMultipleRecords(
        "userquery",
        `?$select=userqueryid,name&$filter=returnedtypecode eq '${escapedEntityType}' and statecode eq 0&$orderby=name asc`
      );

      const rawViews: ViewInfo[] = [
        ...systemViewsResult.entities.map((v) => ({
          id: v["savedqueryid"] as string,
          name: v["name"] as string,
          entityType,
        })),
        ...personalViewsResult.entities.map((v) => ({
          id: v["userqueryid"] as string,
          name: v["name"] as string,
          entityType,
        })),
      ];

      const dedupedViews = new Map<string, ViewInfo>();
      rawViews.forEach((view) => {
        if (!dedupedViews.has(view.id)) {
          dedupedViews.set(view.id, view);
        }
      });

      const views = [...dedupedViews.values()].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      if (this._isDestroyed) {
        return;
      }
      this._availableViews = views;

      // Trigger a re-render with the loaded views
      this._notifyOutputChanged();
    } catch (_err) {
      // Non-fatal: views dropdown will simply not appear
      this._availableViews = [];
    }
  }

  /**
   * Handles a user-initiated view change from the ViewSelector dropdown.
   * Uses a type cast to access changeViewById, which is available at runtime
   * in the PCF framework but not reflected in the community type definitions.
   */
  private _handleViewChange = (viewId: string): void => {
    this._currentViewId = viewId;
    // changeViewById is a runtime-available method on DataSet in PCF; cast to any
    // since it is missing from the @types/powerapps-component-framework type stubs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._context.parameters.sampleDataSet as any).changeViewById(viewId);
  };

  /**
   * Handles removal of a tag (disassociation of a record).
   * Disassociation is performed via the WebAPI deleteRecord call,
   * which removes the related link for 1:N or N:N relationship datasets.
   */
  private _handleRecordRemove = (recordId: string): void => {
    const dataset = this._context.parameters.sampleDataSet;
    const entityType = dataset.getTargetEntityType();
    if (!entityType) {
      return;
    }
    const relationshipLookupField =
      this._context.parameters.relationshipLookupField.raw;

    // For 1:N relationships, nulling the lookup disassociates the child record
    // without deleting it. If no lookup field is configured, we fallback to delete.
    const removePromise = relationshipLookupField
      ? this._context.webAPI.updateRecord(entityType, recordId, {
          [relationshipLookupField]: null,
        })
      : this._context.webAPI.deleteRecord(entityType, recordId);

    removePromise
      .then(() => {
        dataset.refresh();
      })
      .catch(() => {
        // If deletion fails, still refresh to keep the UI state consistent
        dataset.refresh();
      });
  };
}
