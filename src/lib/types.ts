export type DuplicateMode = "All" | "Only duplicates" | "Only unique";

export type AifRecord = {
  AIF: string;
  Name?: string;
  Number?: string;
  Network?: string;
  "Business Name"?: string;
};

export type AifRecordSet = {
  records: AifRecord[];
  loadWarnings: string[];
};

