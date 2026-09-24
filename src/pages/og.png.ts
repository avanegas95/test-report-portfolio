import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { APIRoute } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getReportId, getVersion } from "@/lib/version";

export const prerender = true;

function loadFont(packageName: string, fileName: string): Buffer {
  return readFileSync(
    join(
      process.cwd(),
      "node_modules/@fontsource",
      packageName,
      "files",
      fileName,
    ),
  );
}

const sans600 = loadFont(
  "ibm-plex-sans",
  "ibm-plex-sans-latin-600-normal.woff",
);
const sans500 = loadFont(
  "ibm-plex-sans",
  "ibm-plex-sans-latin-500-normal.woff",
);
const mono600 = loadFont(
  "ibm-plex-mono",
  "ibm-plex-mono-latin-600-normal.woff",
);

export const GET: APIRoute = async () => {
  const version = getVersion();
  const reportId = getReportId();

  // Satori element tree uses plain objects, not React types.
  const markup = {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        color: "#14161a",
        padding: "72px 80px",
        fontFamily: "IBM Plex Sans",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "IBM Plex Mono",
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "#636b78",
                  },
                  children: reportId,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "IBM Plex Mono",
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#636b78",
                  },
                  children: version,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 28,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 72,
                    fontWeight: 600,
                    lineHeight: 1.05,
                    letterSpacing: "-0.025em",
                  },
                  children: "Anderson Vanegas",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          backgroundColor: "#e6f4ec",
                          color: "#17693f",
                          borderRadius: 999,
                          padding: "10px 20px",
                          fontFamily: "IBM Plex Mono",
                          fontSize: 22,
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                        },
                        children: "OVERALL: PASS",
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 34,
                    fontWeight: 500,
                    lineHeight: 1.3,
                    color: "#2b3038",
                    maxWidth: 920,
                  },
                  children:
                    "Quality engineering portfolio — test suites, tooling matrix, live quality gates, and sign-off.",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: "IBM Plex Mono",
              fontSize: 22,
              color: "#636b78",
            },
            children: "Staff SQA Engineer · Test Report",
          },
        },
      ],
    },
  };

  const svg = await satori(markup as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: "IBM Plex Sans", data: sans500, weight: 500, style: "normal" },
      { name: "IBM Plex Sans", data: sans600, weight: 600, style: "normal" },
      { name: "IBM Plex Mono", data: mono600, weight: 600, style: "normal" },
    ],
  });

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
