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
export default app;
