import { describe, expect, it } from "vitest";
import { encodeQrMatrix } from "./encode-qr-matrix";

describe("encodeQrMatrix", () => {
  it("encodes a non-empty string into a square matrix", () => {
    const matrix = encodeQrMatrix("https://civia.example/auth/eidas");
    expect(matrix.size).toBeGreaterThan(10);
    expect(matrix.isDark(0, 0)).toBeTypeOf("boolean");
  });

  it("includes standard finder patterns in the top-left corner", () => {
    const matrix = encodeQrMatrix("hello");
    expect(matrix.isDark(0, 0)).toBe(true);
    expect(matrix.isDark(0, 6)).toBe(true);
    expect(matrix.isDark(6, 0)).toBe(true);
  });

  it("rejects empty payloads", () => {
    expect(() => encodeQrMatrix("   ")).toThrow(/non-empty/i);
  });

  it("produces stable output for the same input", () => {
    const first = encodeQrMatrix("civia://wallet/present");
    const second = encodeQrMatrix("civia://wallet/present");
    expect(first.size).toBe(second.size);

    for (let row = 0; row < first.size; row += 1) {
      for (let column = 0; column < first.size; column += 1) {
        expect(first.isDark(row, column)).toBe(second.isDark(row, column));
      }
    }
  });
});
