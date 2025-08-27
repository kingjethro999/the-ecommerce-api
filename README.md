## Deployment

## Vercel Edge Run time

### step 1 : Create the api folder in the root and add index.ts file

Add the following code in the file

```
import { handle } from "hono/vercel";

/* eslint-disable antfu/no-import-dist */
// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
import app from "../dist/src/app.js";

export const runtime = "edge";

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const HEAD = handle(app)
export const OPTIONS = handle(app)
```

### step 2: create the vercel.json file in the root

Add the following code

```
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}

```
### step 3 : Create a folder called public and then add .gitkeep

### Push the code to github and deploy to vercel


## VERCEL NODE JS RUNTIME (This might fail, i recommend the edge)

Simply keep everything as before and only update 
the `api/index.ts` and the following code

```
import { handle } from "hono/vercel";

/* eslint-disable antfu/no-import-dist */
// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
import app from "../dist/src/app.js";

export const runtime = "nodejs";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const HEAD = handle(app);
export const OPTIONS = handle(app);

```

Finally add `NODEJS_HELPERS=0` in the .env file