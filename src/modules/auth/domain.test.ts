import { describe, expect, it } from "vitest";
import { isAdminRole } from "@/modules/auth/domain";

describe("isAdminRole", () => {
  it.each(["ADMIN", "VENDEDOR"])("accepts %s", (role) => {
    expect(isAdminRole(role)).toBe(true);
  });

  it.each(["CLIENTE", "", null, undefined, 1])("rejects %s", (role) => {
    expect(isAdminRole(role)).toBe(false);
  });
});
