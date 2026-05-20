import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface SpreadsheetResult {
  rows: Record<string, string>[];
  columns: string[];
}

/**
 * Parse CSV, XLS, or XLSX file into rows + column headers.
 * All values are normalized to strings. Returns a CSV-compatible structure
 * so downstream code (Papa.unparse → backend) works unchanged.
 */
export function parseSpreadsheet(file: File): Promise<SpreadsheetResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const columns = (result.meta.fields ?? []).filter(Boolean) as string[];
          if (!columns.length) {
            reject(new Error('Không đọc được tiêu đề cột từ file CSV.'));
            return;
          }
          resolve({ rows: result.data, columns });
        },
        error: (err) => reject(new Error(`Không thể đọc file CSV: ${err.message}`)),
      });
    });
  }

  if (ext === 'xls' || ext === 'xlsx') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            reject(new Error('File Excel không có sheet nào.'));
            return;
          }
          const sheet = workbook.Sheets[sheetName];
          // header: 1 → array of arrays; then we manually build objects
          const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (raw.length < 2) {
            reject(new Error('File Excel cần ít nhất 2 dòng (tiêu đề + dữ liệu).'));
            return;
          }

          const headerRow = (raw[0] as unknown[]).map((h) =>
            h == null ? '' : String(h).trim(),
          );
          const columns = headerRow.filter(Boolean);
          if (!columns.length) {
            reject(new Error('Dòng đầu tiên phải là tiêu đề cột.'));
            return;
          }

          const rows: Record<string, string>[] = [];
          for (let i = 1; i < raw.length; i++) {
            const rowArr = raw[i] as unknown[];
            const isEmpty = rowArr.every((v) => v == null || String(v).trim() === '');
            if (isEmpty) continue;
            const obj: Record<string, string> = {};
            headerRow.forEach((col, idx) => {
              if (!col) return;
              const val = rowArr[idx];
              if (val instanceof Date) {
                // format dates as YYYY-MM-DD
                obj[col] = val.toISOString().slice(0, 10);
              } else {
                obj[col] = val == null ? '' : String(val).trim();
              }
            });
            rows.push(obj);
          }

          resolve({ rows, columns });
        } catch (err) {
          reject(new Error(`Không thể đọc file Excel: ${(err as Error).message}`));
        }
      };
      reader.onerror = () => reject(new Error('Không thể đọc file.'));
      reader.readAsBinaryString(file);
    });
  }

  return Promise.reject(new Error(`Định dạng file không hỗ trợ: .${ext}. Chỉ hỗ trợ .csv, .xls, .xlsx`));
}
