/** Nomzod formalari uchun umumiy natija tipi. */
export type CmsResult = {
  status: "idle" | "success" | "error";
  message: string;
  field?: string;
};

export const idleCms: CmsResult = { status: "idle", message: "" };
