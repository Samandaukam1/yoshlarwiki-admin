/** Bot bo'limi formalari holati ("use server" fayli obyekt eksport qila olmaydi). */
export type BotResult = {
  status: "idle" | "success" | "error";
  message: string;
  url?: string;
};

export const idleBot: BotResult = { status: "idle", message: "" };
