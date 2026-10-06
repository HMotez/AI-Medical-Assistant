// A title written into the name ("Dr. Demo") would be doubled by "Dr. {{name}}"
const TITLE = /^(dr\.?|docteur|doctor|pr\.?|prof\.?)\s+/i;

/** Name without a leading title such as "Dr." */
export const withoutTitle = (name = "") => name.replace(TITLE, "").trim();

/** First name, ignoring a leading title. */
export const firstName = (name = "") => withoutTitle(name).split(/\s+/)[0] || name;
