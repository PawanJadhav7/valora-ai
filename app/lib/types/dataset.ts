export type DatasetIssues = {
  missing: string[];
  detected: string[];
};

export type ClientDataset = {
  rows: any[];
  issues?: DatasetIssues;
};