/**
 * Name utility functions for splitting and joining names
 * Used to convert between fullName (UI) and firstName/lastName (API)
 */

/**
 * Splits a full name into firstName and lastName
 * Splits the name in half - if odd number of words, the extra word goes to lastName
 * 
 * @param fullName - The full name string to split
 * @returns An object with firstName and lastName
 * 
 * @example
 * splitFullName("أحمد محمد علي") // { firstName: "أحمد", lastName: "محمد علي" }
 * splitFullName("أحمد محمد") // { firstName: "أحمد", lastName: "محمد" }
 * splitFullName("أحمد") // { firstName: "أحمد", lastName: "" }
 */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  if (!fullName || fullName.trim() === "") {
    return { firstName: "", lastName: "" };
  }

  const trimmedName = fullName.trim();
  const words = trimmedName.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (words.length === 1) {
    return { firstName: words[0], lastName: "" };
  }

  // Split in half - if odd, the extra word goes to lastName
  const midPoint = Math.ceil(words.length / 2);
  const firstName = words.slice(0, midPoint).join(" ");
  const lastName = words.slice(midPoint).join(" ");

  return { firstName, lastName };
}

/**
 * Joins firstName and lastName into a full name
 * 
 * @param firstName - The first name
 * @param lastName - The last name
 * @returns The combined full name
 * 
 * @example
 * joinFullName("أحمد", "محمد علي") // "أحمد محمد علي"
 * joinFullName("أحمد", "") // "أحمد"
 */
export function joinFullName(
  firstName?: string | null,
  lastName?: string | null
): string {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";

  if (!first && !last) {
    return "";
  }

  if (!first) {
    return last;
  }

  if (!last) {
    return first;
  }

  return `${first} ${last}`;
}

/**
 * Transforms a RegisterRequest-like object with fullName to firstName/lastName
 * 
 * @param data - Object containing fullName instead of firstName/lastName
 * @returns Object with firstName and lastName instead of fullName
 */
export function transformFullNameToSplit<T extends { fullName: string }>(
  data: T
): Omit<T, "fullName"> & { firstName: string; lastName: string } {
  const { fullName, ...rest } = data;
  const { firstName, lastName } = splitFullName(fullName);
  return { ...rest, firstName, lastName };
}

/**
 * Transforms an AuthResponse with firstName/lastName to include fullName
 * 
 * @param response - AuthResponse with firstName and lastName
 * @returns AuthResponse with added fullName property
 */
export function transformSplitNameToFull<T extends { firstName?: string | null; lastName?: string | null }>(
  response: T
): T & { fullName?: string } {
  const fullName = joinFullName(response.firstName, response.lastName);
  return { ...response, fullName: fullName || undefined };
}

