import { describe, expect, it } from "vitest";
import { getStockStatus, isLowStock, isWarningStock } from "@/lib/inventory";

const product = { id: "p1", name: "Aceite", unit: "lt", minStock: 3 };

describe("inventory stock status", () => {
  it("marca bajo cuando el stock es menor o igual al mínimo", () => {
    expect(isLowStock(product, 3)).toBe(true);
    expect(getStockStatus(product, 2)).toBe("low");
  });

  it("marca atención solo con una unidad sobre el mínimo", () => {
    expect(isWarningStock(product, 4)).toBe(true);
    expect(getStockStatus(product, 4)).toBe("warning");
    expect(getStockStatus(product, 5)).toBe("ok");
  });
});
