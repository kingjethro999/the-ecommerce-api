import { Scalar } from "@scalar/hono-api-reference";
import packageJSON from "../../package.json" with { type: "json" };
export default function configureOpenAPI(app) {
    app.doc("/doc", {
        openapi: "3.0.0",
        info: {
            version: packageJSON.version,
            title: "Crossplatform Ecommerce API",
        },
    });
    app.get("/scalar", Scalar({ url: "/doc", theme: "kepler", layout: "modern", defaultHttpClient: {
            targetKey: "js",
            clientKey: "fetch",
        } }));
}
