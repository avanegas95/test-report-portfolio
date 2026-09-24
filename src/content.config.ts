import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { Site, Suite } from "@/lib/content-schemas";

const site = defineCollection({
  loader: file("src/content/site.json", {
    parser: (text) => [{ id: "site", ...JSON.parse(text) }],
  }),
  schema: Site,
});

const suites = defineCollection({
  loader: glob({ pattern: "*.json", base: "src/content/suites" }),
  schema: Suite,
});

export const collections = { site, suites };
