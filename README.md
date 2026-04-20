# EntityListAsKeywordControl

A **PowerApps Component Framework (PCF)** custom control for **Dynamics 365 / Power Apps** that replaces a standard related Entity subgrid with a keyword-tagging interface built with React and Fluent UI.

---

## Features

- 🏷️ **Keyword tag display** – Renders each related record as a coloured, pill-shaped tag
- 💬 **Tooltip with full details** – Hovering over a tag shows all other columns (beyond the first) as a formatted tooltip
- 🔄 **View selector** – Users can switch between any available system or personal view for the related entity
- ♿ **Accessible** – ARIA roles, keyboard-navigable remove buttons, high-contrast mode support
- ⚡ **Fluent UI** – Consistent with the Dynamics 365 / Power Platform design language

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

---

## License

MIT
