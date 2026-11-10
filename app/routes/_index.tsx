import { redirect } from "react-router";

// The front door is the product page. Sign-in is one click from there.
export const loader = () => redirect("/welcome");

export default function Index() {
  return null;
}
