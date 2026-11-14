/**
 * Central TypeScript types re-exported from shared schemas.
 * Person 1, Person 2, and Person 3 should import types from here or worldSchema.
 */
export * from '../schemas/worldSchema';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}
