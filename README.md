# EntityListAsKeywordControl

A **PowerApps Component Framework (PCF)** custom control for **Dynamics 365 / Power Apps** that replaces a standard related Entity subgrid with a keyword-tagging interface built with React and Fluent UI.

---

## Features

- 🏷️ **Keyword tag display** – Renders each related record as a coloured, pill-shaped tag
- 💬 **Tooltip with full details** – Hovering over a tag shows all other columns (beyond the first) as a formatted tooltip
- 🔄 **View selector** – Users can switch between any available system or personal view for the related entity
- ♿ **Accessible** – ARIA roles, keyboard-navigable remove buttons, high-contrast mode support
- ⚡ **Fluent UI** – Consistent with the Dynamics 365 / Power Platform design language
- 🎨 **Maker customisation** – Configurable tag colours and tooltip behavior from control inputs

### Capability summary

- Handles both **system views** (`savedquery`) and **personal views** (`userquery`) and merges them in one dropdown.
- Supports **record disassociation/removal** from the related list directly in the UI.
- Includes **paging awareness** (shows "X of Y" metadata when records exceed page size).
- Works well with **multiple control instances** on the same form (single Fluent icon init + stable handlers).

---

## How it works

| Concern | Implementation |
|---|---|
| First column | Used as the **visible tag label** |
| All other columns | Concatenated into a **tooltip** shown on hover |
| View selection | A `<Dropdown>` lists all available system & personal views fetched via the WebAPI |
| Record removal | Calls `webAPI.deleteRecord` then refreshes the dataset |
| Paging | Defaults to 250 records per page |

---

## Project structure

```
EntityListAsKeywordControl/
├── ControlManifest.Input.xml   # PCF manifest (dataset control)
├── index.ts                    # PCF ReactControl entry point
├── components/
│   ├── TagControl.tsx          # Main React component (tag list + view selector)
│   ├── TagItem.tsx             # Individual tag pill with tooltip
│   └── ViewSelector.tsx        # Fluent UI dropdown for view switching
├── types/
│   └── ViewInfo.ts             # ViewInfo interface
├── css/
│   └── EntityListAsKeywordControl.css
├── package.json
├── tsconfig.json
└── EntityListAsKeywordControl.pcfproj
```

---

## Getting started

### Prerequisites

- Node.js >= 18
- [Power Platform CLI (pac)](https://aka.ms/PowerAppsCLI) (optional, for packaging)

### Build

```bash
cd EntityListAsKeywordControl
npm install
npm run build
```

### Run the PCF test harness locally

```bash
npm run start
```

Then open http://localhost:8181 to see the control with sample data.

### Package for deployment

```bash
pac solution init --publisher-name <YourPublisher> --publisher-prefix <prefix>
pac solution add-reference --path ./EntityListAsKeywordControl
msbuild /t:build /restore
```

---

## Configuration

The control is a **dataset** PCF control. Add it to a form subgrid:

1. Open the **Form Editor** for your target table
2. Add or select a **Subgrid** component
3. In the subgrid properties, choose **Controls** → **Add control** → select **EntityListAsKeywordControl**
4. Set the control as the default for Web / Tablet / Phone as needed

The view used initially is whatever view the app maker configures for the subgrid. At runtime the user can switch views via the dropdown inside the control.

### Optional input properties

- `tagBackgroundColor` (text, e.g. `#EFF6FC`)
- `tagBorderColor` (text, e.g. `#C7E0F4`)
- `tagTextColor` (text, e.g. `#005A9E`)
- `showTooltips` (two options, default `true`)
- `tooltipMaxLines` (whole number, default `8`)

### Input behavior details

| Property | Type | Default | What it controls |
|---|---|---:|---|
| `tagBackgroundColor` | Text | `#EFF6FC` | Fill color for each tag pill |
| `tagBorderColor` | Text | `#C7E0F4` | Border color for each tag pill |
| `tagTextColor` | Text | `#005A9E` | Text color inside tag pills |
| `showTooltips` | TwoOptions | `true` | Whether additional column details appear on hover |
| `tooltipMaxLines` | Whole Number | `8` | Max number of details shown in tooltip |

If `tooltipMaxLines` is set below 1, the control automatically clamps it to `1` so users still get meaningful hover details.

---

## Developer notes (junior-friendly)

### Data mapping rules

- The **first visible column** of the selected view becomes the tag label.
- Remaining columns are converted to `Display Name: Formatted Value` lines in the tooltip.
- Empty/null formatted values are skipped.

### Where key logic lives

- `index.ts`: PCF lifecycle entry point (init/update/destroy), view loading, and WebAPI actions.
- `components/TagControl.tsx`: Transforms dataset records into tags and renders list + view selector.
- `components/TagItem.tsx`: Visual tag pill, tooltip host, and remove action.

### Security/stability guardrails in code

- OData filter values are escaped when querying views.
- Async view-loading avoids mutating state if control has already been destroyed.
- Handler functions are stable (no repeated `.bind(this)` allocation on every update).

---

## Publish as unmanaged solution (scripted)

Use the script below to build, pack, and import this control as an unmanaged solution:

```bash
chmod +x scripts/publish-unmanaged.sh
scripts/publish-unmanaged.sh \
  --publisher-name "Contoso" \
  --publisher-prefix "cts" \
  --solution-name "EntityKeywordTags" \
  --solution-version "1.0.0.0" \
  --environment-url "https://org.crm.dynamics.com"
```

What the script does:
1. Runs `npm ci` + `npm run build` for the PCF control.
2. Creates a temporary solution project with `pac solution init`.
3. Adds the PCF project reference.
4. Builds and locates the unmanaged zip.
5. Imports the zip to your target Dataverse environment and publishes changes.

---

## License

MIT
