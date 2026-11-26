// Cursor app identity: the simulated viewer for local development. Yours to edit.
import type { DevViewer } from "./identity.js";

export const DEV_VIEWER: DevViewer | null = {
  sub: "user:dev",
  email: "dev@example.com",
  name: "Dev Viewer",
  teamId: 1,
  teamRole: "admin",
};
