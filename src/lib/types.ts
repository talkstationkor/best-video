// Shapes of the data the tmt Best Video API returns. Dates arrive as ISO
// strings (e.g. "2026-09-21T03:13:09.694Z").

export type Member = {
  id: string;
  name: string;
  team: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
