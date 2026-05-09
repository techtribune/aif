import { permanentRedirect } from "next/navigation";

/** Legacy URL; home (`/`) is the canonical showcase. */
export default function DisplayAliasPage() {
  permanentRedirect("/");
}
