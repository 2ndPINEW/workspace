import {
  Application,
  Router,
  RouterContext,
} from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { lsw } from "./util/tmux.ts";

const app = new Application();
const router = new Router();

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${
      hostname ?? "localhost"
    }:${port}`
  );
});

app.addEventListener("error", (evt) => {
  console.log(evt.error);
});

router.get("/tmux/windows", async (ctx: RouterContext) => {
  ctx.response.body = {
    windows: await lsw(),
  };
});

router.get("/tmux/windows/active", async (ctx: RouterContext) => {
  const windows = await lsw()
  const activeWindow = windows.find(window => window.active)
  ctx.response.body = {
    window: activeWindow,
  };
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 9281 });
