# Oneflow Copy Products

Adds a **Kopier** button to the vertical tab sidebar on an Oneflow document. Clicking it copies each product description and its `Antall` (pcs) from the rendered tilbud PDF into the clipboard.

[Install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/oneflow-copy-products/oneflow-copy-products.user.js)

## How it works

- Reads the PDF text layer (`.react-pdf__Page__textContent`) inside the Oneflow document view.
- Groups spans by their vertical position to reconstruct rows.
- Starts after the `Beskrivelse` header row and stops at the totals section (`Installasjonkostnader` / `Listepris` / `Sum eks mva`).
- For each row it extracts the description column (left < 45 %) and the `N pcs` quantity from the Antall column (left 74–84 %).
- Quantity-only rows are appended to the previous description line with ` | `.

## Output format

```
IWMAC HW: Mini Gateway | 1 pcs
Leveres av Wethal
IWMAC Modul: Refrigeration
IWMAC Image: System image - Machinery
- Maskinbilde | 2 pcs
- Varme/isvannsbilde
Per refrigeration position/section including image | 50 pcs
...
```
