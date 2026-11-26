// Cursor app identity: simulated viewer for local development.
/** @type {{ sub: string, email: string, name: string, teamId: number, teamRole: "admin" | "member" } | null} */
export const DEV_VIEWER = {
  sub: "user:dev",
  email: "dev@example.com",
  name: "Dev Viewer",
  teamId: 1,
  teamRole: "admin",
};
