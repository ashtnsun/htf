import { CodeXml, Compass, PenTool, type LucideIcon } from "lucide-react";
import type { RoleIcon } from "@/lib/content/schemas";

/** Content names an icon by role kind; the components resolve it to a lucide icon here. */
export const ROLE_ICONS: Record<RoleIcon, LucideIcon> = {
  lead: Compass,
  code: CodeXml,
  design: PenTool,
};
