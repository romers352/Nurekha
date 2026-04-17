/**
 * Client-side CSV export helper.
 * Converts an array of row objects to a CSV string and triggers a file download.
 */

function escapeCsvValue(v) {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) v = v.join("; ");
  if (typeof v === "object") v = JSON.stringify(v);
  const s = String(v);
  // Quote if contains comma, quote, newline, or starts/ends with whitespace
  if (/[",\n\r]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * @param {string} filename e.g. "orders_2026-04-17.csv"
 * @param {Array<Object>} rows array of flat objects
 * @param {Array<{key: string, header?: string}>} [columns] optional column definitions
 *   If omitted, keys are derived from the first row.
 */
export function downloadCSV(filename, rows, columns) {
  if (!rows || rows.length === 0) {
    alert("Nothing to export — the list is empty.");
    return;
  }

  const cols =
    columns && columns.length
      ? columns
      : Object.keys(rows[0]).map((k) => ({ key: k, header: k }));

  const headerLine = cols.map((c) => escapeCsvValue(c.header || c.key)).join(",");
  const bodyLines = rows.map((row) =>
    cols.map((c) => escapeCsvValue(row[c.key])).join(",")
  );

  const csv = [headerLine, ...bodyLines].join("\n");
  // BOM for Excel to detect UTF-8 correctly
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Generate a timestamp suffix for filenames: "2026-04-17_150803" */
export function filenameTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
