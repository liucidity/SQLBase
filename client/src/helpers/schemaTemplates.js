const field = (fieldName, dataType, opts = {}) => ({
  fieldName,
  dataType,
  varcharSize: opts.varcharSize || "",
  mod1: opts.mod1 || "",
  mod2: opts.mod2 || "",
  default: opts.default || "",
  reference: opts.reference || "",
  relationType: opts.relationType || "one-to-many",
});

const table = (name, fields) => ({ table: name, fields });

// ── Templates ───────────────────────────────────────────────

export const SCHEMA_TEMPLATES = [
  {
    id: "ecommerce",
    label: "E-commerce",
    icon: "🛒",
    description: "Users, products, orders, and order items",
    tables: [
      table("users", [
        field("email", "VARCHAR", { varcharSize: "255", mod1: "NOT NULL", mod2: "UNIQUE" }),
        field("first_name", "VARCHAR", { varcharSize: "100", mod1: "NOT NULL" }),
        field("last_name", "VARCHAR", { varcharSize: "100", mod1: "NOT NULL" }),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
      table("products", [
        field("name", "VARCHAR", { varcharSize: "255", mod1: "NOT NULL" }),
        field("description", "TEXT"),
        field("price", "DECIMAL", { mod1: "NOT NULL" }),
        field("stock_quantity", "INT", { default: "0" }),
        field("category", "VARCHAR", { varcharSize: "100" }),
      ]),
      table("orders", [
        field("user_id", "INT", { mod1: "NOT NULL", reference: "users" }),
        field("total_amount", "DECIMAL", { mod1: "NOT NULL" }),
        field("status", "VARCHAR", { varcharSize: "50", default: "pending" }),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
      table("order_items", [
        field("order_id", "INT", { mod1: "NOT NULL", reference: "orders" }),
        field("product_id", "INT", { mod1: "NOT NULL", reference: "products" }),
        field("quantity", "INT", { mod1: "NOT NULL" }),
        field("unit_price", "DECIMAL", { mod1: "NOT NULL" }),
      ]),
    ],
  },
  {
    id: "blog",
    label: "Blog",
    icon: "✍️",
    description: "Authors, posts, comments, and tags",
    tables: [
      table("authors", [
        field("name", "VARCHAR", { varcharSize: "150", mod1: "NOT NULL" }),
        field("email", "VARCHAR", { varcharSize: "255", mod1: "NOT NULL", mod2: "UNIQUE" }),
        field("bio", "TEXT"),
      ]),
      table("posts", [
        field("title", "VARCHAR", { varcharSize: "255", mod1: "NOT NULL" }),
        field("body", "TEXT", { mod1: "NOT NULL" }),
        field("author_id", "INT", { mod1: "NOT NULL", reference: "authors" }),
        field("status", "VARCHAR", { varcharSize: "20", default: "draft" }),
        field("published_at", "TIMESTAMP"),
      ]),
      table("comments", [
        field("post_id", "INT", { mod1: "NOT NULL", reference: "posts" }),
        field("author_name", "VARCHAR", { varcharSize: "150", mod1: "NOT NULL" }),
        field("body", "TEXT", { mod1: "NOT NULL" }),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
      table("tags", [
        field("name", "VARCHAR", { varcharSize: "100", mod1: "NOT NULL", mod2: "UNIQUE" }),
      ]),
    ],
  },
  {
    id: "saas",
    label: "SaaS",
    icon: "☁️",
    description: "Organizations, users, and subscriptions",
    tables: [
      table("organizations", [
        field("name", "VARCHAR", { varcharSize: "255", mod1: "NOT NULL" }),
        field("plan", "VARCHAR", { varcharSize: "50", default: "free" }),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
      table("users", [
        field("org_id", "INT", { mod1: "NOT NULL", reference: "organizations" }),
        field("email", "VARCHAR", { varcharSize: "255", mod1: "NOT NULL", mod2: "UNIQUE" }),
        field("role", "VARCHAR", { varcharSize: "50", default: "member" }),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
      table("subscriptions", [
        field("org_id", "INT", { mod1: "NOT NULL", reference: "organizations" }),
        field("status", "VARCHAR", { varcharSize: "50", mod1: "NOT NULL" }),
        field("amount", "DECIMAL", { mod1: "NOT NULL" }),
        field("starts_at", "DATE", { mod1: "NOT NULL" }),
        field("ends_at", "DATE"),
      ]),
      table("audit_logs", [
        field("user_id", "INT", { reference: "users" }),
        field("action", "VARCHAR", { varcharSize: "255", mod1: "NOT NULL" }),
        field("metadata", "TEXT"),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
    ],
  },
  {
    id: "hr",
    label: "HR",
    icon: "👥",
    description: "Departments, employees, and performance reviews",
    tables: [
      table("departments", [
        field("name", "VARCHAR", { varcharSize: "150", mod1: "NOT NULL" }),
        field("budget", "DECIMAL"),
      ]),
      table("employees", [
        field("first_name", "VARCHAR", { varcharSize: "100", mod1: "NOT NULL" }),
        field("last_name", "VARCHAR", { varcharSize: "100", mod1: "NOT NULL" }),
        field("email", "VARCHAR", { varcharSize: "255", mod1: "NOT NULL", mod2: "UNIQUE" }),
        field("department_id", "INT", { reference: "departments" }),
        field("job_title", "VARCHAR", { varcharSize: "150" }),
        field("salary", "DECIMAL"),
        field("hire_date", "DATE"),
      ]),
      table("reviews", [
        field("employee_id", "INT", { mod1: "NOT NULL", reference: "employees" }),
        field("reviewer_id", "INT", { reference: "employees" }),
        field("score", "INT"),
        field("notes", "TEXT"),
        field("review_date", "DATE", { mod1: "NOT NULL" }),
      ]),
    ],
  },
  {
    id: "social",
    label: "Social",
    icon: "💬",
    description: "Users, posts, follows, and likes",
    tables: [
      table("users", [
        field("username", "VARCHAR", { varcharSize: "100", mod1: "NOT NULL", mod2: "UNIQUE" }),
        field("email", "VARCHAR", { varcharSize: "255", mod1: "NOT NULL", mod2: "UNIQUE" }),
        field("bio", "TEXT"),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
      table("posts", [
        field("user_id", "INT", { mod1: "NOT NULL", reference: "users" }),
        field("content", "TEXT", { mod1: "NOT NULL" }),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
      table("follows", [
        field("follower_id", "INT", { mod1: "NOT NULL", reference: "users" }),
        field("following_id", "INT", { mod1: "NOT NULL" }),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
      table("likes", [
        field("user_id", "INT", { mod1: "NOT NULL", reference: "users" }),
        field("post_id", "INT", { mod1: "NOT NULL", reference: "posts" }),
        field("created_at", "TIMESTAMP", { default: "NOW()" }),
      ]),
    ],
  },
];
