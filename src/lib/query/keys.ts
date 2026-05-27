export const tokenKeys = {
  all: ["tokens"] as const,
  list: () => [...tokenKeys.all, "list"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  profile: (username: string) =>
    [...userKeys.all, "profile", username] as const,
};

export const runeKeys = {
  all: ["runes"] as const,
  list: (params?: { sort?: string; lang?: string }) =>
    [...runeKeys.all, "list", params ?? {}] as const,
  detail: (name: string) => [...runeKeys.all, "detail", name] as const,
  search: (q: string) => [...runeKeys.all, "search", q] as const,
};
