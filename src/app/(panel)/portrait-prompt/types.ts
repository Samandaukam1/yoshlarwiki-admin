/** Prompt formasi holati ("use server" fayli obyekt eksport qila olmaydi). */
export type PromptState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialPromptState: PromptState = { status: "idle", message: "" };
