export const ROOM_IDS = [1, 2, 3, 4, 5, 6, 7] as const;
export const ROOM_COUNT = ROOM_IDS.length;
export const STRATEGY_MAP_ROOM = 6;
export const KNOWLEDGE_ROOM = 7;
export const MISSION_VERSION = "seven-vault-picture-puzzle-v1";
export const PUZZLE_SIZE = 16;
export const isPuzzleOrder = (order: unknown): order is number[] =>
  Array.isArray(order) &&
  order.length === PUZZLE_SIZE &&
  new Set(order).size === PUZZLE_SIZE &&
  order.every((n) => Number.isInteger(n) && n >= 0 && n < PUZZLE_SIZE);
export const isPuzzleSolved = (order: unknown) =>
  isPuzzleOrder(order) && order.every((tile, index) => tile === index);
