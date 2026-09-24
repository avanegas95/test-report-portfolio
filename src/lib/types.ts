import type { Status } from "./status";

export interface TestCaseStory {
  precondition: string;
  steps: string[];
  expected: string;
  actual: string;
  terminal?: Array<
    { cmd: string } | { line: string; result: string; status: Status }
  >;
  tags?: string[];
}

export interface TestCase {
  id: string;
  title: string;
  area: string;
  status: Status;
  defaultOpen?: boolean;
  story?: TestCaseStory;
}

export interface Suite {
  id: string;
  company: string;
  title: string;
  start: string;
  end: string | null;
  chip: "info" | "neutral";
  cases: TestCase[];
}
