import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { countBirthdaysThisWeek, getBirthdayBoard } from "@/lib/services/loyalty";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const summary = new URL(request.url).searchParams.get("summary");
    if (summary === "week") {
      const count = await countBirthdaysThisWeek();
      return jsonOk({ count });
    }
    const board = await getBirthdayBoard();
    return jsonOk(board);
  } catch (error) {
    return jsonError(error);
  }
}
