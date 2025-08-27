import configureOpenAPI from "./lib/configure-open-api.js";
import createApp from "./lib/create-app.js";
import banners from "./routes/banners/banners.index.js";
import brands from "./routes/brands/brands.index.js";
import categories from "./routes/categories/categories.index.js";
import departments from "./routes/departments/departments.index.js";
import home from "./routes/home/home.index.js";
import orders from "./routes/orders/orders.index.js";
import products from "./routes/products/products.index.js";
import stats from "./routes/stats/stats.index.js";
import stripe from "./routes/stripe/stripe.index.js";
import users from "./routes/users/users.index.js";
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
