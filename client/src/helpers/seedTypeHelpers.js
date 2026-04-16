import {
  randNumber,
  randFloat,
  randFullName,
  randFirstName,
  randLastName,
  randEmail,
  randPhoneNumber,
  randAddress,
  randCity,
  randCountry,
  randZipCode,
  randCompanyName,
  randJobTitle,
  randDepartment,
  randUrl,
  randUuid,
  randUserName,
  randPassword,
  randGender,
  randLanguage,
  randColor,
  randParagraph,
  randSentence,
  randWord,
  randBoolean,
  randBrand,
  randBetweenDate,
  randStatus,
} from "@ngneat/falso";

// ─── Category definitions ────────────────────────────────────────────────────
// Each entry: { label, generate(opts) }
// opts = { min, max } for numeric types, unused otherwise

export const SEED_CATEGORIES = {
  // ── Person
  full_name:   { label: "Full Name",       generate: ()      => randFullName() },
  first_name:  { label: "First Name",      generate: ()      => randFirstName() },
  last_name:   { label: "Last Name",       generate: ()      => randLastName() },
  email:       { label: "Email",           generate: ()      => randEmail() },
  phone:       { label: "Phone Number",    generate: ()      => randPhoneNumber() },
  username:    { label: "Username",        generate: ()      => randUserName() },
  password:    { label: "Password",        generate: ()      => randPassword() },
  gender:      { label: "Gender",          generate: ()      => randGender() },
  age:         { label: "Age (18–80)",     generate: (o={}) => randNumber({ min: o.min ?? 18, max: o.max ?? 80 }) },

  // ── Location
  address:     { label: "Street Address",  generate: ()      => randAddress().street },
  city:        { label: "City",            generate: ()      => randCity() },
  country:     { label: "Country",         generate: ()      => randCountry() },
  zip_code:    { label: "Zip / Postal",    generate: ()      => randZipCode() },

  // ── Work
  company_name:{ label: "Company Name",   generate: ()      => randCompanyName() },
  job_title:   { label: "Job Title",      generate: ()      => randJobTitle() },
  department:  { label: "Department",     generate: ()      => randDepartment() },
  salary:      { label: "Salary",         generate: (o={}) => Math.round(randNumber({ min: o.min ?? 30000, max: o.max ?? 200000 }) / 1000) * 1000 },
  brand:       { label: "Brand",          generate: ()      => randBrand() },

  // ── Commerce
  price:       { label: "Price",          generate: (o={}) => randFloat({ min: o.min ?? 1, max: o.max ?? 1000, fraction: 2 }) },
  rating:      { label: "Rating (1–5)",   generate: (o={}) => randFloat({ min: o.min ?? 1, max: o.max ?? 5, fraction: 1 }) },

  // ── Web / Tech
  url:         { label: "URL",            generate: ()      => randUrl() },
  uuid:        { label: "UUID",           generate: ()      => randUuid() },
  language:    { label: "Language",       generate: ()      => randLanguage() },
  color:       { label: "Color",          generate: ()      => randColor() },
  status:      { label: "Status",         generate: ()      => randStatus() },

  // ── Text
  word:        { label: "Random Word",    generate: ()      => randWord() },
  sentence:    { label: "Sentence",       generate: ()      => randSentence() },
  paragraph:   { label: "Paragraph",      generate: ()      => randParagraph() },

  // ── Primitives
  integer:     { label: "Integer",        generate: (o={}) => randNumber({ min: o.min ?? 1, max: o.max ?? 1000 }) },
  float:       { label: "Float",          generate: (o={}) => randFloat({ min: o.min ?? 0, max: o.max ?? 1000, fraction: 2 }) },
  boolean:     { label: "Boolean",        generate: ()      => randBoolean() },
  date:        { label: "Date",           generate: ()      => randBetweenDate({ from: new Date("2000-01-01"), to: new Date() }).toISOString().split("T")[0] },
};

// Categories that expose min/max inputs
export const NUMERIC_CATEGORIES = new Set([
  "age", "salary", "price", "rating", "integer", "float",
]);

// ─── Heuristic inference ─────────────────────────────────────────────────────

export const inferSeedType = (fieldName, dataType = "") => {
  const n = fieldName.toLowerCase();
  const dt = dataType.toUpperCase();

  // Person
  if (n === "age")                                                  return "age";
  if (n.includes("first_name") || n === "firstname")               return "first_name";
  if (n.includes("last_name")  || n === "lastname")                return "last_name";
  if (n.includes("full_name")  || n.includes("fullname"))          return "full_name";
  if (n.includes("email"))                                          return "email";
  if (n.includes("phone") || n.includes("tel"))                    return "phone";
  if (n === "name" || n.endsWith("_name"))                         return "full_name";
  if (n.includes("username")   || n.includes("user_name"))         return "username";
  if (n.includes("password")   || n === "pass" || n === "pwd")     return "password";
  if (n.includes("gender")     || n.includes("sex"))               return "gender";

  // Location
  if (n.includes("address") || n.includes("street"))               return "address";
  if (n.includes("city"))                                           return "city";
  if (n.includes("country"))                                        return "country";
  if (n.includes("zip") || n.includes("postal"))                   return "zip_code";

  // Work
  if (n.includes("company") || n.includes("employer"))             return "company_name";
  if (n.includes("job_title") || n.includes("jobtitle") || (n.includes("title") && !n.includes("product"))) return "job_title";
  if (n.includes("department") || n.includes("dept"))              return "department";
  if (n.includes("salary") || n.includes("wage") || n.includes("income")) return "salary";
  if (n.includes("brand") || n.includes("manufacturer"))           return "brand";

  // Commerce
  if (n.includes("price") || n.includes("cost") || n.includes("fee") || n.includes("amount")) return "price";
  if (n.includes("rating"))                                         return "rating";

  // Web / Tech
  if (n.includes("url") || n.includes("website") || n.includes("link")) return "url";
  if (n.includes("uuid") || n.includes("guid"))                    return "uuid";
  if (n.includes("color") || n.includes("colour"))                 return "color";
  if (n.includes("language") || n.includes("lang"))                return "language";
  if (n.includes("status"))                                         return "status";

  // Text
  if (n.includes("description") || n.includes("bio") || n.includes("about") || n.includes("summary")) return "paragraph";

  // Data-type fallbacks
  if (dt.includes("BOOL"))                                          return "boolean";
  if (dt.includes("DATE") || dt.includes("TIME"))                  return "date";
  if (dt.includes("UUID"))                                          return "uuid";
  if (dt.includes("TEXT") || dt.includes("VARCHAR") || dt.includes("CHAR")) return "word";
  if (dt.includes("FLOAT") || dt.includes("DECIMAL") || dt.includes("NUMERIC")) return "float";
  if (dt.includes("INT"))                                           return "integer";

  return "word";
};
