/** Server action natijasi ("use server" fayli obyekt eksport qila olmaydi). */
export type ActionResult = {
  status: "idle" | "success" | "error";
  message: string;
  candidateId?: string;
};

export const idleResult: ActionResult = { status: "idle", message: "" };
