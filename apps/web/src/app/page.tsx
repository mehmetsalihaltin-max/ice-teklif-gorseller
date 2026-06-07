import { redirect } from "next/navigation";

export default function Home() {
  // Middleware token yoksa /login'e yönlendirir.
  redirect("/dashboard");
}
