import { addDaysStr, todayStr } from "./dates";
import type { Product, StockMovement } from "./types";

export function getInitialProducts(): Product[] {
  return [
    { id: "prod-001", name: "Pechuga de pollo", unit: "kg", minStock: 5 },
    { id: "prod-002", name: "Aceite vegetal", unit: "lt", minStock: 3 },
    { id: "prod-003", name: "Servilletas", unit: "paquete", minStock: 10 },
    { id: "prod-004", name: "Tortillas de maíz", unit: "kg", minStock: 8 },
    { id: "prod-005", name: "Cebolla blanca", unit: "kg", minStock: 4 },
    { id: "prod-006", name: "Tomate rojo", unit: "kg", minStock: 6 },
    { id: "prod-007", name: "Queso Oaxaca", unit: "kg", minStock: 3 },
    { id: "prod-008", name: "Refrescos 600ml", unit: "pieza", minStock: 24 },
    { id: "prod-009", name: "Aguacate", unit: "kg", minStock: 5 },
    { id: "prod-010", name: "Harina de trigo", unit: "kg", minStock: 10 },
  ];
}

export function getInitialMovements(): StockMovement[] {
  const today = todayStr();
  const d = (offset: number) => addDaysStr(today, offset);
  const ts = (date: string) => `${date}T10:00:00.000Z`;

  return [
    { id: "mov-001", productId: "prod-001", type: "in", quantity: 25, date: d(-12), createdAt: ts(d(-12)) },
    { id: "mov-002", productId: "prod-001", type: "out", quantity: 5, date: d(-10), note: "Preparación semanal", createdAt: ts(d(-10)) },
    { id: "mov-003", productId: "prod-001", type: "out", quantity: 8, date: d(-7), createdAt: ts(d(-7)) },
    { id: "mov-004", productId: "prod-001", type: "out", quantity: 6, date: d(-4), createdAt: ts(d(-4)) },
    { id: "mov-005", productId: "prod-001", type: "out", quantity: 3, date: d(-1), createdAt: ts(d(-1)) },

    { id: "mov-006", productId: "prod-002", type: "in", quantity: 10, date: d(-14), createdAt: ts(d(-14)) },
    { id: "mov-007", productId: "prod-002", type: "out", quantity: 2, date: d(-8), createdAt: ts(d(-8)) },
    { id: "mov-008", productId: "prod-002", type: "out", quantity: 3, date: d(-5), createdAt: ts(d(-5)) },
    { id: "mov-009", productId: "prod-002", type: "out", quantity: 1, date: d(-2), createdAt: ts(d(-2)) },

    { id: "mov-010", productId: "prod-003", type: "in", quantity: 15, date: d(-11), createdAt: ts(d(-11)) },
    { id: "mov-011", productId: "prod-003", type: "out", quantity: 8, date: d(-6), createdAt: ts(d(-6)) },
    { id: "mov-012", productId: "prod-003", type: "out", quantity: 5, date: d(-3), createdAt: ts(d(-3)) },

    { id: "mov-013", productId: "prod-004", type: "in", quantity: 20, date: d(-9), createdAt: ts(d(-9)) },
    { id: "mov-014", productId: "prod-004", type: "out", quantity: 6, date: d(-5), createdAt: ts(d(-5)) },
    { id: "mov-015", productId: "prod-004", type: "out", quantity: 4, date: d(-1), createdAt: ts(d(-1)) },

    { id: "mov-016", productId: "prod-005", type: "in", quantity: 8, date: d(-10), createdAt: ts(d(-10)) },
    { id: "mov-017", productId: "prod-005", type: "out", quantity: 3, date: d(-6), createdAt: ts(d(-6)) },
    { id: "mov-018", productId: "prod-005", type: "out", quantity: 4, date: d(-2), createdAt: ts(d(-2)) },

    { id: "mov-019", productId: "prod-006", type: "in", quantity: 12, date: d(-8), createdAt: ts(d(-8)) },
    { id: "mov-020", productId: "prod-006", type: "out", quantity: 4, date: d(-3), createdAt: ts(d(-3)) },

    { id: "mov-021", productId: "prod-007", type: "in", quantity: 6, date: d(-7), createdAt: ts(d(-7)) },
    { id: "mov-022", productId: "prod-007", type: "out", quantity: 4, date: d(-2), note: "Enchiladas", createdAt: ts(d(-2)) },

    { id: "mov-023", productId: "prod-008", type: "in", quantity: 48, date: d(-13), createdAt: ts(d(-13)) },
    { id: "mov-024", productId: "prod-008", type: "out", quantity: 20, date: d(-4), createdAt: ts(d(-4)) },

    { id: "mov-025", productId: "prod-009", type: "in", quantity: 10, date: d(-6), createdAt: ts(d(-6)) },
    { id: "mov-026", productId: "prod-009", type: "out", quantity: 7, date: d(-1), createdAt: ts(d(-1)) },

    { id: "mov-027", productId: "prod-010", type: "in", quantity: 25, date: d(-15), createdAt: ts(d(-15)) },
    { id: "mov-028", productId: "prod-010", type: "out", quantity: 10, date: d(-5), createdAt: ts(d(-5)) },
  ];
}
