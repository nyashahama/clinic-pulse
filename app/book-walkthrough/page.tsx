import { redirect } from "next/navigation";

export default function BookWalkthroughPage() {
  redirect("/?booking=1");
}
