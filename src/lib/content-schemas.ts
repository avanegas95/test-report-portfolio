import { z } from "astro/zod";

export const Status = z.enum(["pass", "warn", "fail", "info"]);

export const Story = z.object({
  precondition: z.string(),
  steps: z.array(z.string()).min(1),
  expected: z.string(),
  actual: z.string(),
  terminal: z
    .array(
      z.union([
        z.object({ cmd: z.string() }),
        z.object({ line: z.string(), result: z.string(), status: Status }),
      ]),
    )
    .optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

export const Case = z
  .object({
    id: z.string().regex(/^[A-Z]{2}-\d{3}$/),
    title: z.string(),
    area: z.string(),
    status: Status,
    defaultOpen: z.boolean().default(false),
    story: Story.optional(),
  })
  .refine((c) => !c.defaultOpen || c.story, {
    message: "defaultOpen requires a story",
  });

export const Suite = z
  .object({
    id: z.string().regex(/^[A-Z]{2}$/),
    company: z.string(),
    title: z.string(),
    start: z.string(),
    end: z.string().nullable(),
    chip: z.enum(["info", "neutral"]),
    order: z.number().optional(),
    cases: z.array(Case).min(1),
  })
  .refine((s) => s.cases.every((c) => c.id.startsWith(`${s.id}-`)), {
    message: "case ids must start with suite id prefix",
  });

export const Metric = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("static"),
    value: z.string(),
    label: z.string(),
    status: Status.optional(),
  }),
  z.object({
    kind: z.literal("computed"),
    metric: z.enum(["suiteCount", "toolCount", "passRate", "caseCount"]),
    label: z.string(),
    status: Status.optional(),
  }),
]);

export const Contact = z.object({
  email: z.string().email(),
  linkedin: z.string().url(),
  github: z.string().url(),
  resumePdf: z.string(),
});

const SectionHeader = z.object({
  eyebrow: z.string(),
  title: z.string(),
  lede: z.string(),
});

export const Site = z.object({
  report: z.object({
    subject: z.string(),
    location: z.string(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    title: z.string(),
    titleSuffix: z.string(),
    verdict: z.string(),
    bio: z.string(),
    ctas: z.array(
      z.object({
        label: z.string(),
        href: z.string(),
        variant: z.enum(["primary", "secondary"]),
      }),
    ),
  }),
  subjectCard: z.object({
    badge: z.object({ status: Status, label: z.string() }),
    rows: z.array(
      z.object({
        key: z.string(),
        value: z.string(),
        note: z.string().optional(),
      }),
    ),
  }),
  metrics: z.array(Metric),
  suitesSection: SectionHeader,
  environmentSection: SectionHeader,
  tools: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
  testBeds: z.object({
    group: z.string(),
    items: z.array(z.string()),
  }),
  qualitySection: SectionHeader,
  signoff: z.object({
    eyebrow: z.string(),
    title: z.string(),
    titleSuffix: z.string(),
    lede: z.string(),
    approvals: z.array(
      z.object({
        key: z.string(),
        value: z.string(),
        placeholderStyle: z.boolean().optional(),
      }),
    ),
    knownIssue: z.object({
      id: z.string(),
      status: Status,
      label: z.string(),
      text: z.string(),
    }),
  }),
  contact: Contact,
  footer: z.object({
    left: z.string(),
    right: z.string(),
  }),
});

export type StatusValue = z.infer<typeof Status>;
export type StoryValue = z.infer<typeof Story>;
export type CaseValue = z.infer<typeof Case>;
export type SuiteValue = z.infer<typeof Suite>;
export type MetricValue = z.infer<typeof Metric>;
export type ContactValue = z.infer<typeof Contact>;
export type SiteValue = z.infer<typeof Site>;
