/** Login formasi holati. "use server" fayllari obyekt eksport qila olmaydi. */
export type LoginState = {
  status: "idle" | "error";
  message: string;
};

export const initialLoginState: LoginState = { status: "idle", message: "" };
