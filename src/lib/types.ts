import type { CaseValue, StoryValue, SuiteValue } from "./content-schemas";

export type TestCaseStory = StoryValue;
export type TestCase = CaseValue;
export type Suite = Omit<SuiteValue, "order">;
