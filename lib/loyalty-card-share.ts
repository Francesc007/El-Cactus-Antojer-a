/** Mensaje para que el cliente (o el negocio) abra WhatsApp con el enlace de la tarjeta. */
export function formatLoyaltyCardWhatsAppMessage(firstName: string, cardUrl: string): string {
  const cactus = String.fromCodePoint(0x1f335);
  return [
    `${cactus} Tu tarjeta VIP de El Cactus ${cactus}`,
    "",
    `Hola ${firstName}, guarda este enlace para abrir tu tarjeta y mostrar el código en el negocio:`,
    whatsAppPreviewUrl(cardUrl),
  ].join("\n");
}

/**
 * WhatsApp no vuelve a poner la foto si el enlace es idéntico al anterior.
 * Un dato corto y distinto en cada envío hace que arme otra vez la vista previa.
 */
function whatsAppPreviewUrl(cardUrl: string): string {
  try {
    const url = new URL(cardUrl);
    url.searchParams.set("v", Date.now().toString(36));
    return url.toString();
  } catch {
    return cardUrl;
  }
}

export function loyaltyCardImageFileName(folio: string): string {
  const safe = folio.replace(/[^A-Za-z0-9-]/g, "") || "vip";
  return `tarjeta-${safe}.png`;
}
