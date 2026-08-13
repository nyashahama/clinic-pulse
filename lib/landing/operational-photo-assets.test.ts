import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { operationalLandingPhotos } from "@/components/landing/photo-assets";

const pexelsLicenseUrl = "https://www.pexels.com/legal-pages/license/";

const approvedPhotos = {
  heroWorker: {
    id: "hero-clinic-worker",
    src: "/landing/clinic-worker-phone.jpg",
    alt: "clinician in a white coat checking a smartphone while holding a notebook",
    credit: "Tessy Agbonome",
    caption: "Illustrative primary-care context",
    sourceUrl:
      "https://www.pexels.com/photo/doctor-sitting-with-notebook-and-smartphone-19963173/",
    sha256: "5ec557bdea2a2e408a738d0d43bf4a907d61637aa81be66886475d96720be10b",
    width: 1600,
    height: 1067,
    position: "center",
  },
  fieldReport: {
    id: "field-report-context",
    src: "/landing/field-report-context.jpg",
    alt: "healthcare worker outdoors speaking on a phone beside a clipboard",
    credit: "Laura James",
    caption: "Illustrative field-reporting context",
    sourceUrl:
      "https://www.pexels.com/photo/black-physician-talking-on-smartphone-at-table-on-street-6097764/",
    sha256: "62a3b64b4fa7c9e3542ffbb54fa399c5f9b4d9965101f7b233f099c229aac914",
    width: 1400,
    height: 2100,
    position: "center 44%",
  },
  patientRoute: {
    id: "patient-route-context",
    src: "/landing/patient-route-context.jpg",
    alt: "person outdoors holding a folder while checking a smartphone",
    credit: "Charlotte May",
    caption: "Illustrative mobile-routing context",
    sourceUrl:
      "https://www.pexels.com/photo/black-woman-with-folder-using-smartphone-5965914/",
    sha256: "9e640e68f9e30ad99937030c91f9a827a580b0ed9f7a7dbd9e1800db26ba13b3",
    width: 1400,
    height: 933,
    position: "center",
  },
} as const;

function readJpegDimensions(bytes: Buffer) {
  expect(bytes.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))).toBe(true);

  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    const markerStart = offset - 1;
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;

    const segmentLength = bytes.readUInt16BE(offset);
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof) {
      return {
        height: bytes.readUInt16BE(markerStart + 5),
        width: bytes.readUInt16BE(markerStart + 7),
      };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG dimensions not found");
}

describe("operational landing photo assets", () => {
  it("defines only the three approved photo-story roles", () => {
    expect(Object.keys(operationalLandingPhotos)).toEqual([
      "heroWorker",
      "fieldReport",
      "patientRoute",
    ]);
    expect(Object.keys(approvedPhotos)).toEqual(Object.keys(operationalLandingPhotos));
    expect(Object.values(operationalLandingPhotos)).toHaveLength(3);
  });

  it("keeps every asset local, traceable, factual, and reasonably sized", () => {
    const paths = new Set<string>();
    const ids = new Set<string>();
    const sourceUrls = new Set<string>();

    for (const [role, photo] of Object.entries(operationalLandingPhotos)) {
      const approved = approvedPhotos[role as keyof typeof approvedPhotos];
      expect(approved).toBeDefined();
      expect(photo).toMatchObject({
        id: approved.id,
        src: approved.src,
        alt: approved.alt,
        credit: approved.credit,
        caption: approved.caption,
        sourceUrl: approved.sourceUrl,
        licenseLabel: "Pexels License",
        licenseUrl: pexelsLicenseUrl,
        position: approved.position,
      });
      expect(photo.src).toMatch(/^\/landing\/[a-z0-9-]+\.jpg$/);
      expect(paths.has(photo.src)).toBe(false);
      paths.add(photo.src);

      expect(ids.has(photo.id)).toBe(false);
      ids.add(photo.id);
      expect(sourceUrls.has(photo.sourceUrl)).toBe(false);
      sourceUrls.add(photo.sourceUrl);
      expect(photo.alt.trim().length).toBeGreaterThan(20);
      expect(photo.caption).toMatch(/^Illustrative .+ context$/);
      expect(photo.credit.trim().length).toBeGreaterThan(2);
      expect(new URL(photo.sourceUrl).hostname).toBe("www.pexels.com");
      expect(photo.licenseLabel).toBe("Pexels License");
      expect(photo.licenseUrl).toBe(pexelsLicenseUrl);
      expect(`${photo.alt} ${photo.caption}`).not.toMatch(
        /south african|clinic pulse (user|customer)|clinic pulse deployment/i,
      );

      const asset = statSync(join(process.cwd(), "public", photo.src.slice(1)));
      expect(asset.isFile()).toBe(true);
      expect(asset.size).toBeLessThan(350_000);

      const bytes = readFileSync(join(process.cwd(), "public", photo.src.slice(1)));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(approved.sha256);
      expect(readJpegDimensions(bytes)).toEqual({
        width: approved.width,
        height: approved.height,
      });
    }
  });
});
