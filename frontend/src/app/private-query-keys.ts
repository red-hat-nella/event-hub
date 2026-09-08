export const privateQueryKey = (userId: string | undefined, generation: number, ...parts: unknown[]) => ['private', userId, generation, ...parts] as const;
