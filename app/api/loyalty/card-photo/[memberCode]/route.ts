import { readPublicLoyaltyPhoto } from "@/lib/services/loyalty";

export async function GET(
  _request: Request,
  context: { params: Promise<{ memberCode: string }> }
) {
  const { memberCode } = await context.params;
  const photo = await readPublicLoyaltyPhoto(memberCode);
  if (!photo) {
    return new Response(null, { status: 404 });
  }
  return new Response(Buffer.from(photo.bytes), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, max-age=120",
    },
  });
}
