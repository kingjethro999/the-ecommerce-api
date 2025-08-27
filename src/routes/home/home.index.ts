/* eslint-disable style/arrow-parens */
import type { Context } from "hono";

import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

// src/routes/home/home.index.ts
import { createRouter } from "@/lib/create-app";

const router = createRouter();

// Helper function to escape HTML
function escapeHtml(str: string) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[tag] || tag)
  );
}

// Data
const features = [
  { icon: "🛍️", text: "Complete ecommerce API with all essential endpoints" },
  { icon: "🏬", text: "Department and category management system" },
  { icon: "📦", text: "Advanced product management with variants" },
  { icon: "🏷️", text: "Brand management and product categorization" },
  { icon: "🛒", text: "Full order management and tracking system" },
  { icon: "💳", text: "Payment status and transaction handling" },
  { icon: "📊", text: "Sales analytics and reporting endpoints" },
  { icon: "🎨", text: "Banner and promotional content management" },
  { icon: "👥", text: "User roles and authentication with Clerk" },
  { icon: "📝", text: "Auto-generated OpenAPI documentation" },
  { icon: "⚡", text: "Built on blazing fast Hono.js framework" },
  { icon: "🔐", text: "Secure API with proper validation and auth" },
];

const apiEndpoints = [
  {
    name: "Departments",
    path: "/departments",
    description: "Manage product departments",
  },
  {
    name: "Categories",
    path: "/categories",
    description: "Product categories within departments",
  },
  { name: "Brands", path: "/brands", description: "Brand management system" },
  {
    name: "Products",
    path: "/products",
    description: "Complete product catalog management",
  },
  {
    name: "Orders",
    path: "/orders",
    description: "Order processing and management",
  },
  {
    name: "Banners",
    path: "/banners",
    description: "Marketing banners and promotions",
  },
];

const gettingStarted = [
  "Clone the repository",
  "Run `pnpm install` to install dependencies",
  "Copy `.env.example` to `.env` and configure your variables",
  "Set up your database URL and authentication keys",
  "Run `npx prisma migrate dev --name init` to set up database",
  "Run `npx prisma db seed` to populate with sample data",
  "Start development server with `pnpm dev`",
  "Visit `/scalar` to explore the API documentation",
];

const deploymentOptions = [
  {
    title: "Railway | Render (Node.js Server)",
    link: "https://ecommerce-api-production.up.railway.app",
    steps: [
      "No changes needed: `git clone repo url`",
      "Run `pnpm install`",
      "Add environment variables from `.env.example`",
      "Test locally: seed database and run `pnpm dev`",
      "Push to GitHub and deploy to Railway/Render",
    ],
    note: "Railway provides PostgreSQL database or use your own Neon/Supabase DB.",
  },
  {
    title: "Vercel Edge Runtime (Serverless)",
    link: "https://ecommerce-pro-api.vercel.app",
    steps: [
      "Fork the repository to your GitHub account",
      "Connect your GitHub repo to Vercel",
      "Add environment variables in Vercel dashboard",
      "Deploy automatically on every push",
    ],
    note: "Perfect for serverless deployment with automatic scaling.",
  },
  {
    title: "Cloudflare Workers",
    link: "https://ecommerce-api.your-domain.workers.dev/",
    steps: [
      "Install Wrangler CLI: `npm install -g wrangler`",
      "Authenticate: `wrangler login`",
      "Configure `wrangler.toml` with your settings",
      "Set environment variables using Wrangler",
      "Deploy with `wrangler publish`",
    ],
    note: "Edge deployment for global low-latency API responses.",
  },
];

// HTML Route
router.get("/", (c: Context) => {
  // Generate feature HTML
  const featuresHtml = features
    .map(
      (feature) => `
    <li class="flex items-center bg-white p-4 rounded-lg shadow-sm border-l-4 border-emerald-500">
      <span class="feature-icon text-2xl mr-3">${escapeHtml(
        feature.icon
      )}</span>
      <span class="text-gray-700">${escapeHtml(feature.text)}</span>
    </li>
  `
    )
    .join("");

  // Generate API endpoints HTML
  const endpointsHtml = apiEndpoints
    .map(
      (endpoint) => `
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-emerald-300 transition-colors">
      <h3 class="font-semibold text-emerald-600 text-lg">${escapeHtml(
        endpoint.name
      )}</h3>
      <p class="text-sm text-gray-500 mb-2">${escapeHtml(endpoint.path)}</p>
      <p class="text-gray-700">${escapeHtml(endpoint.description)}</p>
    </div>
  `
    )
    .join("");

  // Generate getting started HTML
  const gettingStartedHtml = gettingStarted
    .map(
      (step) => `
    <li class="text-gray-700">${escapeHtml(step)}</li>
  `
    )
    .join("");

  // Generate deployment options HTML
  const deploymentHtml = deploymentOptions
    .map(
      (option) => `
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <a href="${
        option.link
      }" class="text-xl font-medium mb-3 text-emerald-600 block hover:text-emerald-700 transition-colors">${escapeHtml(
        option.title
      )}</a>
      <ol class="list-decimal pl-5 space-y-1 mb-3">
        ${option.steps
          .map(
            (step) =>
              `<li class="text-sm text-gray-700">${escapeHtml(step)}</li>`
          )
          .join("")}
      </ol>
      <p class="text-sm text-gray-500 bg-gray-50 p-3 rounded">${escapeHtml(
        option.note
      )}</p>
    </div>
  `
    )
    .join("");

  const aboutEcommerceHtml = `
    <section class="mb-12 bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-lg shadow-sm border">
      <h2 class="text-2xl font-semibold mb-4 text-gray-800">🚀 About Ecommerce Pro API</h2>
      <div class="space-y-4">
        <p class="text-gray-700 text-lg">
          A comprehensive, production-ready ecommerce API built with modern technologies and best practices.
        </p>
        <h3 class="text-xl font-medium text-emerald-600">Why choose this API?</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Complete Solution:</strong> Everything needed for a modern ecommerce platform</li>
            <li><strong>Scalable Architecture:</strong> Built to handle growth from startup to enterprise</li>
            <li><strong>Modern Stack:</strong> Hono.js, Prisma, TypeScript, and OpenAPI</li>
            <li><strong>Type Safety:</strong> Full TypeScript coverage with Zod validation</li>
            <li><strong>Authentication Ready:</strong> Integrated with Clerk for user management</li>
            <li><strong>Database Agnostic:</strong> Works with PostgreSQL, MySQL, and more</li>
          </ul>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Auto Documentation:</strong> OpenAPI specs with interactive Scalar UI</li>
            <li><strong>Edge Compatible:</strong> Deploy anywhere - servers or serverless</li>
            <li><strong>Developer Experience:</strong> Hot reload, TypeScript, and great tooling</li>
            <li><strong>Production Ready:</strong> Error handling, validation, and security</li>
            <li><strong>Extensible:</strong> Clean architecture for easy customization</li>
            <li><strong>Well Tested:</strong> Comprehensive validation and error handling</li>
          </ul>
        </div>
        <div class="mt-6 p-4 bg-emerald-100 rounded-lg border border-emerald-200">
          <p class="text-emerald-800">
            <strong>💡 Perfect For:</strong> Building ecommerce platforms, marketplace APIs, product catalogs, 
            order management systems, and any retail-focused application requiring robust backend infrastructure.
          </p>
        </div>
      </div>
    </section>
  `;

  const htmlContent = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ecommerce Pro API - Production Ready Ecommerce Backend</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛍️</text></svg>">
        <style>
          .feature-icon { width: 28px; height: 28px; }
          .gradient-bg { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        </style>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-6xl mx-auto px-4 py-12">
          <header class="mb-12 text-center">
            <div class="gradient-bg text-white p-8 rounded-2xl shadow-lg mb-8">
              <h1 class="text-5xl font-bold mb-4">🛍️ Ecommerce Pro API</h1>
              <p class="text-xl opacity-90">Complete, Production-Ready Ecommerce Backend Solution</p>
              <p class="text-lg opacity-80 mt-2">Built with Hono.js, Prisma, TypeScript & OpenAPI</p>
              <div class="mt-6 flex justify-center gap-4">
                <a href="/scalar" class="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md">
                  📖 API Documentation
                </a>
                <a href="https://github.com/your-username/ecommerce-pro-api" class="bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors shadow-md">
                  ⭐ View on GitHub
                </a>
              </div>
            </div>
          </header>

          <!-- API Endpoints Section -->
          <section class="mb-12">
            <h2 class="text-3xl font-semibold mb-6 text-gray-800 text-center">🔗 API Endpoints</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              ${endpointsHtml}
            </div>
            <div class="text-center">
              <a href="/scalar" class="inline-flex items-center bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md">
                📋 Explore Full API Documentation
              </a>
            </div>
          </section>

          <!-- Features Section -->
          <section class="mb-12">
            <h2 class="text-3xl font-semibold mb-6 text-gray-800 text-center">✨ Features</h2>
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${featuresHtml}
            </ul>
          </section>

          <!-- Getting Started Section -->
          <section class="mb-12">
            <h2 class="text-3xl font-semibold mb-6 text-gray-800 text-center">🚀 Quick Start</h2>
            <div class="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <ol class="list-decimal pl-5 space-y-3 text-lg">
                ${gettingStartedHtml}
              </ol>
              <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p class="text-blue-800">
                  <strong>🎯 Pro Tip:</strong> The seed data includes 10 departments, 40 categories, 6 brands, 80 products, and 6 banners - perfect for testing!
                </p>
              </div>
            </div>
          </section>

          <!-- Deployment Section -->
          <section class="mb-12">
            <h2 class="text-3xl font-semibold mb-6 text-gray-800 text-center">☁️ Deployment Options</h2>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              ${deploymentHtml}
            </div>
          </section>

          <!-- About Section -->
          ${aboutEcommerceHtml}

          <footer class="text-center text-gray-500 border-t pt-8">
            <div class="flex justify-center gap-8 mb-4">
              <a href="/scalar" class="text-emerald-600 hover:text-emerald-700 font-semibold">📖 API Docs</a>
              <a href="https://github.com/your-username/ecommerce-pro-api" class="text-emerald-600 hover:text-emerald-700 font-semibold">💻 GitHub</a>
              <a href="/health" class="text-emerald-600 hover:text-emerald-700 font-semibold">💚 Health Check</a>
            </div>
            <p class="text-sm">Built with ❤️ using Hono.js, Prisma, and modern web technologies</p>
            <p class="text-xs mt-2 opacity-75">This comprehensive ecommerce API represents 60+ hours of development time</p>
          </footer>
        </div>
      </body>
    </html>`;

  return c.html(htmlContent);
});

// Separate the OpenAPI handler to ensure proper typing
function openApiHandler(c: Context) {
  const accept = c.req.header("Accept");

  if (accept?.includes("text/html")) {
    // Return a proper redirect response
    return c.redirect("/", HttpStatusCodes.MOVED_TEMPORARILY);
  }

  // Explicitly return the JSON response
  return c.json({
    message: "Welcome to the Ecommerce Pro API",
    description: "A complete, production-ready ecommerce backend solution",
    version: "1.0.0",
    documentation: "/scalar",
    endpoints: {
      departments: "/departments",
      categories: "/categories",
      brands: "/brands",
      products: "/products",
      orders: "/orders",
      banners: "/banners",
    },
    features: [
      "Complete CRUD operations for all ecommerce entities",
      "User authentication and authorization",
      "Order management and tracking",
      "Product catalog with categories and brands",
      "Auto-generated OpenAPI documentation",
      "Type-safe with TypeScript and Zod validation",
    ],
  });
}

// Keep the OpenAPI route for API clients
router.openapi(
  createRoute({
    tags: ["Home"],
    method: "get",
    path: "/",
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          description: z.string(),
          version: z.string(),
          documentation: z.string(),
          endpoints: z.object({
            departments: z.string(),
            categories: z.string(),
            brands: z.string(),
            products: z.string(),
            orders: z.string(),
            banners: z.string(),
          }),
          features: z.array(z.string()),
        }),
        "Ecommerce Pro API Home"
      ),
      [HttpStatusCodes.MOVED_TEMPORARILY]: {
        description:
          "Redirects to HTML version when Accept header includes text/html",
        headers: z.object({
          Location: z.string().url(),
        }),
      },
    },
  }),
  openApiHandler
);

export default router;
