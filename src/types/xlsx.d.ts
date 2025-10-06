declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [name: string]: WorkSheet };
  }

  export interface WorkSheet {
    [cell: string]: any;
  }

  export interface WriteFileOptions {
    bookType?: string;
    type?: string;
  }

  export const utils: {
    json_to_sheet: (data: any[]) => WorkSheet;
    book_new: () => WorkBook;
    book_append_sheet: (workbook: WorkBook, worksheet: WorkSheet, name: string) => void;
  };

  export function writeFile(workbook: WorkBook, filename: string, options?: WriteFileOptions): void;
  export function write(workbook: WorkBook, options?: WriteFileOptions): any;
}