/** Política de duração das sessões abertas no login. */
export interface SessionSettings {
  durationInSeconds: number;
}

export const SESSION_SETTINGS = Symbol('SessionSettings');
