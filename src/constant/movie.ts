/**
 * Constants để xử lý movie servers và episodes
 */

export const SERVER_TYPES = {
  VIETSUB: "vietsub",
  THUYET_MINH: "thuyet-minh",
} as const;

export const SERVER_DISPLAY_NAMES = {
  [SERVER_TYPES.VIETSUB]: "Vietsub",
  [SERVER_TYPES.THUYET_MINH]: "Thuyết minh",
} as const;

export type ServerType = (typeof SERVER_TYPES)[keyof typeof SERVER_TYPES];

/**
 * Mapping server names từ API response
 */
export const SERVER_NAME_MAPPING: Record<string, ServerType> = {
  vietsub: SERVER_TYPES.VIETSUB,
  "lồng tiếng": SERVER_TYPES.THUYET_MINH,
  "thuyết minh": SERVER_TYPES.THUYET_MINH,
};

/**
 * Default server khi không có param
 */
export const DEFAULT_SERVER = SERVER_TYPES.VIETSUB;

/**
 * Default episode khi không có param
 */
export const DEFAULT_EPISODE = 1;
