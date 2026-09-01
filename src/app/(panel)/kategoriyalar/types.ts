/** Kategoriya formasi natijasi. */
export type CategoryResult = {
  status: "idle" | "success" | "error";
  message: string;
};

export const idleCategory: CategoryResult = { status: "idle", message: "" };
