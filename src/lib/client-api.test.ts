import { describe, expect, it } from "vitest";
import {
  getApiErrorMessage,
  getUnknownErrorMessage,
} from "@/lib/client-api";

describe("client API errors", () => {
  it("reads both legacy and standardized API errors", () => {
    expect(getApiErrorMessage({ error: "Falha antiga" })).toBe(
      "Falha antiga",
    );
    expect(
      getApiErrorMessage({ error: { code: "INVALID", message: "Falha nova" } }),
    ).toBe("Falha nova");
  });

  it("uses safe fallback messages", () => {
    expect(getApiErrorMessage(null, "Fallback")).toBe("Fallback");
    expect(getUnknownErrorMessage("erro", "Fallback")).toBe("Fallback");
  });
});
