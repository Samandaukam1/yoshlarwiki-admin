/** Sozlama formalari uchun umumiy natija. */
export type SettingsResult = {
  status: "idle" | "success" | "error";
  message: string;
};

export const idleSettings: SettingsResult = { status: "idle", message: "" };
