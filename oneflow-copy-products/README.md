# Oneflow + HubSpot Copy Products

Adds a copy button to two places:

- **Oneflow** — a clipboard icon in the vertical tab sidebar on an Oneflow document. Copies each product description and its `Antall` (pcs) from the rendered tilbud PDF.
- **HubSpot** — a **Copy** button next to the **Edit** link inside a deal's **Line items** card. Copies each line item's description and quantity (e.g. `x1`, `x31`).

Both copy as rich HTML (bold headers + bullet list) with a plain-text fallback, so pasting into rich-text editors like Rocketlane keeps the formatting.

[Install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/oneflow-copy-products/oneflow-copy-products.user.js)

## Matches

- `https://app.oneflow.com/*`, `https://*.oneflow.com/*`
- `https://app.hubspot.com/*`, `https://app-eu1.hubspot.com/*`, `https://*.hubspot.com/*`

## How it works

### Oneflow

- Reads the PDF text layer (`.react-pdf__Page__textContent`) inside the Oneflow document view.
- Groups spans by their vertical position to reconstruct rows.
- Starts after the `Beskrivelse` header row and stops at the totals section (`Installasjonkostnader` / `Listepris` / `Sum eks mva`).
- Extracts the description column (left < 45 %) and the `N pcs` quantity from the Antall column (left 74–84 %).
- Rows starting with `IWMAC Product:` / `IWMAC Modul:` become bold section headers.
- Multi-line descriptions (e.g. `IWMAC HW: Wireless MQTT Temperature sensor with` + `external sensor 2m`) are merged back into one bullet.
- If a sub-item row (`- Maskinbilde`) shares a visual line with the parent's quantity, the quantity is re-attributed to the parent bullet above.

### HubSpot

- Finds the **Line items** card by `span[data-selenium-test="crm-card-title"]`.
- Injects a **Copy** button next to the existing **Edit** link inside `span[data-selenium-test="crm-card-actions"]`, reusing HubSpot's button classes so the visual style matches.
- Reads each `[data-test-id="line-items-card-line-item"]` row — pulling the name and the `x{n}` quantity — and outputs a flat bulleted list.

## Output format

Copied as HTML (rendered correctly in Rocketlane / rich-text editors) with a plain-text fallback.

**Oneflow:**

```
Oneflow document info:
IWMAC Product: HW - Gateway and Display
• IWMAC HW: Mini Gateway — 1 pcs
• Leveres av Wethal
IWMAC Modul: Refrigeration
• IWMAC Image: System image - Machinery — 2 pcs
• - Maskinbilde
• - Varme/isvannsbilde
• Per refrigeration position/section including image — 50 pcs
...
```

**HubSpot:**

```
HubSpot line items:
• IWMAC License: Energy — x1
• Per energy meter — x3
• IWMAC Image: System Image Energy — x1
• Per refrigeration position/section including image — x31
• IWMAC License: Ventilation — x1
• Per Ventilation system — x1
• IWMAC Image: System Image Ventilation — x1
```
