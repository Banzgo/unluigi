/**
 * Generic helpers for building compile-time-checked "defaults" objects.
 */

/** Keys of T whose value type includes `undefined` (i.e. optional fields). */
export type OptionalKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? K : never }[keyof T];

/**
 * The shape a defaults object for T must have: exactly T's optional keys,
 * each required and with `undefined` stripped from its value type.
 *
 * Declare a defaults object with `satisfies DefaultsFor<T>` so that adding a
 * new optional field to T without also adding a default is a compile error,
 * instead of silently producing `undefined` at runtime wherever the merged
 * result is later treated as `Required<T>`.
 */
export type DefaultsFor<T> = { [K in OptionalKeys<T>]-?: NonNullable<T[K]> };
