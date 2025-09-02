import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import banners from "@/routes/banners/banners.index";
import brands from "@/routes/brands/brands.index";
import categories from "@/routes/categories/categories.index";
import departments from "@/routes/departments/departments.index";
import home from "@/routes/home/home.index";
import orders from "@/routes/orders/orders.index";
import products from "@/routes/products/products.index";
import stats from "@/routes/stats/stats.index";
import stripe from "@/routes/stripe/stripe.index";
import users from "@/routes/users/users.index";
import { db } from "@/lib/db";
import { users as usersTable } from "@/lib/schema";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const app = createApp();
app.route("/", home);
const routes = [
  users,
  stripe,
  departments,
  categories,
  brands,
  products,
  banners,
  orders,
  stats,
];
configureOpenAPI(app);
routes.forEach((route) => {
  app.route("/api", route);
});

// Simple admin creation interface (no frontend dependency)
app.get("/admin_make", (c) => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Create Admin</title>
    <style>
    *{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif;background:#f6f7f9;padding:24px}
      .card{max-width:480px;margin:40px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
      .hd{padding:20px 24px;border-bottom:1px solid #eef0f2}
      .hd h1{margin:0;font-size:18px}
      .bd{padding:24px}
      label{display:block;font-size:12px;color:#374151;margin-bottom:6px}
      input{width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px}
      .row{margin-bottom:14px}
      .btn{display:inline-flex;align-items:center;gap:8px;background:#204462;color:#fff;border:none;border-radius:8px;padding:10px 14px;font-weight:600;cursor:pointer}
      .muted{color:#6b7280;font-size:12px;margin-top:6px}
      .ok{background:#065f46}
      .err{background:#7f1d1d}
    </style>
  </head>
  <body>
    <div class="card">
      <div class="hd"><h1>Create Admin Account</h1></div>
      <div class="bd">
        <form method="post" action="/admin_make">
          <div class="row">
            <label for="name">Full name</label>
            <input id="name" name="name" required />
          </div>
          <div class="row">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div class="row">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" minlength="6" required />
          </div>
          <button class="btn" type="submit">Create Admin</button>
          <p class="muted">Only users with access to this URL can create an admin.</p>
        </form>
      </div>
    </div>
  </body>
  </html>`;
  return c.html(html);
});

app.post("/admin_make", async (c) => {
  const formData = await c.req.parseBody();
  const name = String(formData.name || "").trim();
  const email = String(formData.email || "").toLowerCase().trim();
  const password = String(formData.password || "");

  if (!name || !email || !password) {
    return c.html(`<p style="color:#b91c1c">Missing required fields</p>`, 400);
  }

  // Check existing
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length) {
    return c.html(`<p style="color:#065f46">User already exists. ID: ${(existing[0] as any).id}</p>`);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const [user] = await db
    .insert(usersTable)
    .values({
      id: randomUUID(),
      name,
      email,
      phone: `AUTO-${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      password: hashedPassword,
      isVerified: true,
      status: "ACTIVE" as any,
      role: "ADMIN" as any,
      image: null,
      emailVerified: null,
      token: null,
      resetExpiry: null,
      roleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .returning();

  return c.html(`<p style="color:#065f46">Admin created successfully. ID: ${(user as any).id}</p>`);
});
export default app;
