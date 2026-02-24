import { describe, expect, it } from "vitest";

import {
  demoSeekerRequests,
  demoVolunteerRequests,
  getDemoRequestById,
  showcaseCards,
} from "./demo-data";

describe("demo data", () => {
  it("provides seeker and volunteer sample requests", () => {
    expect(demoSeekerRequests.length).toBeGreaterThan(0);
    expect(demoVolunteerRequests.length).toBeGreaterThan(0);
  });

  it("finds request by id", () => {
    const firstId = demoSeekerRequests[0]?.id;
    expect(firstId).toBeTruthy();
    expect(getDemoRequestById(firstId!)).not.toBeNull();
  });

  it("contains three showcase card combinations", () => {
    const kinds = showcaseCards.map((card) => card.kind);
    expect(kinds).toContain("text-image");
    expect(kinds).toContain("text-video");
    expect(kinds).toContain("text-audio");
  });
});
