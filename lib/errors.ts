import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorFromUnknown(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return new AppError(
      error.issues[0]?.message ?? "Los datos enviados no son válidos.",
      "VALIDATION",
      400
    );
  }

  const message =
    error instanceof Error ? error.message : "Error interno del servidor";

  if (message.includes("NO_CAPACITY")) {
    return new AppError("Ya no hay capacidad en ese horario.", "NO_CAPACITY", 409);
  }
  if (message.includes("SLOT_BLOCKED")) {
    return new AppError("Ese horario está bloqueado.", "SLOT_BLOCKED", 409);
  }
  if (message.includes("CLOSED_DAY")) {
    return new AppError("El restaurante está cerrado ese día.", "CLOSED_DAY", 400);
  }
  if (message.includes("OUTSIDE_HOURS")) {
    return new AppError("El horario está fuera de operación.", "OUTSIDE_HOURS", 400);
  }
  if (message.includes("PRIVACY_CONSENT_REQUIRED")) {
    return new AppError(
      "Debes aceptar el aviso de privacidad.",
      "PRIVACY_CONSENT_REQUIRED",
      400
    );
  }
  if (message.includes("INSUFFICIENT_STOCK")) {
    return new AppError("No hay stock suficiente para esa salida.", "INSUFFICIENT_STOCK", 409);
  }
  if (message.includes("PRODUCT_NOT_FOUND")) {
    return new AppError("El producto no existe.", "PRODUCT_NOT_FOUND", 404);
  }
  if (message.includes("PRODUCT_HAS_MOVEMENTS")) {
    return new AppError(
      "No se puede eliminar un producto con movimientos de inventario registrados.",
      "PRODUCT_HAS_MOVEMENTS",
      409
    );
  }
  if (message.includes("INVALID_QUANTITY")) {
    return new AppError("La cantidad debe ser mayor a cero.", "INVALID_QUANTITY", 400);
  }
  if (message.includes("FORBIDDEN")) {
    return new AppError("No tienes permiso para esta acción.", "FORBIDDEN", 403);
  }

  return new AppError(message, "INTERNAL", 500);
}
