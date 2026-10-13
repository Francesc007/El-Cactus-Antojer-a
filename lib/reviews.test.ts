import { describe, expect, it } from "vitest";
import {
  REVIEW_IMAGE_MAX_BYTES,
  REVIEW_IMAGE_TARGET_BYTES,
  REVIEW_PLATFORM_ACTION,
  REVIEW_PLATFORM_LABEL,
  REVIEW_THANKS_BODY,
  REVIEW_THANKS_TITLE,
  isReviewEvidencePath,
  isReviewPlatform,
  isReviewStatus,
  parseReviewIdentifier,
  reviewEvidencePath,
  reviewIdentifierHint,
  reviewInstruction,
} from "@/lib/reviews";

describe("identificador de reseña", () => {
  it("acepta folio en mayúsculas o minúsculas", () => {
    expect(parseReviewIdentifier("C-0001")).toEqual({ kind: "folio", value: "C-0001" });
    expect(parseReviewIdentifier("c-0012")).toEqual({ kind: "folio", value: "C-0012" });
    expect(parseReviewIdentifier("  C-1000  ")).toEqual({ kind: "folio", value: "C-1000" });
  });

  it("acepta teléfono de 10 dígitos o con 52", () => {
    expect(parseReviewIdentifier("5512345678")).toEqual({ kind: "phone", value: "525512345678" });
    expect(parseReviewIdentifier("55 1234 5678")).toEqual({ kind: "phone", value: "525512345678" });
    expect(parseReviewIdentifier("525512345678")).toEqual({ kind: "phone", value: "525512345678" });
  });

  it("rechaza datos incompletos", () => {
    expect(parseReviewIdentifier("")).toBeNull();
    expect(parseReviewIdentifier("551234567")).toBeNull();
    expect(parseReviewIdentifier("folio")).toBeNull();
    expect(parseReviewIdentifier("C-12")).toBeNull();
  });
});

describe("plataformas y textos", () => {
  it("reconoce las tres redes y los estados", () => {
    expect(isReviewPlatform("google")).toBe(true);
    expect(isReviewPlatform("facebook")).toBe(true);
    expect(isReviewPlatform("instagram")).toBe(true);
    expect(isReviewPlatform("tiktok")).toBe(false);
    expect(isReviewStatus("pending")).toBe(true);
    expect(isReviewStatus("approved")).toBe(true);
    expect(isReviewStatus("rejected")).toBe(true);
    expect(isReviewStatus("done")).toBe(false);
  });

  it("tiene etiquetas y acciones para cada red", () => {
    expect(REVIEW_PLATFORM_LABEL.google).toBe("Google Maps");
    expect(REVIEW_PLATFORM_ACTION.google).toContain("reseña");
    expect(REVIEW_PLATFORM_ACTION.facebook).toContain("recomendación");
    expect(REVIEW_PLATFORM_ACTION.instagram.toLowerCase()).toContain("historia");
  });

  it("explica que la red se abre en otra pestaña", () => {
    expect(reviewInstruction("google")).toContain("Google Maps");
    expect(reviewInstruction("google")).toContain("otra pestaña");
    expect(reviewInstruction("facebook")).toContain("captura");
    expect(reviewInstruction("instagram")).toContain("Instagram");
  });

  it("incluye un agradecimiento cálido", () => {
    expect(REVIEW_THANKS_TITLE).toContain("Gracias");
    expect(REVIEW_THANKS_BODY).toContain("El Cactus");
    expect(REVIEW_THANKS_BODY).toContain("captura");
  });

  it("pide teléfono o folio con un texto claro", () => {
    expect(reviewIdentifierHint()).toContain("teléfono");
    expect(reviewIdentifierHint()).toContain("C-0001");
  });
});

describe("límites y ruta de captura", () => {
  it("mantiene la captura por debajo de 1 MB en el servidor y apunta a 450 KB en el celular", () => {
    expect(REVIEW_IMAGE_MAX_BYTES).toBe(1 * 1024 * 1024);
    expect(REVIEW_IMAGE_TARGET_BYTES).toBe(450 * 1024);
    expect(REVIEW_IMAGE_TARGET_BYTES).toBeLessThan(REVIEW_IMAGE_MAX_BYTES);
  });

  it("arma y valida la ruta de archivo", () => {
    const memberId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const fileId = "11111111-2222-3333-4444-555555555555";
    const path = reviewEvidencePath(memberId, fileId, "webp");
    expect(path).toBe(`${memberId}/${fileId}.webp`);
    expect(isReviewEvidencePath(path)).toBe(true);
    expect(isReviewEvidencePath("foto.webp")).toBe(false);
    expect(isReviewEvidencePath(`${memberId}/${fileId}.gif`)).toBe(false);
  });
});
