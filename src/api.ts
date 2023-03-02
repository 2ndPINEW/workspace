import {
  Application,
  Router,
  RouterContext,
} from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { lsw } from "./util/tmux.ts";
import { workspaces } from "./util/vscode.ts";
import { createWindow, initWorkspace, switchWindow } from "./util/workspace.ts";

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

router.get("/workspaces", async (ctx: RouterContext) => {
  ctx.response.body = {
    workspaces: await workspaces()
  }
})

router.post("/workspace/init", async (ctx: RouterContext) => {
  const body = ctx.request.body();
  const json = await body.value;
  await initWorkspace(JSON.parse(json))
  ctx.response.body = {
    status: 200,
  };
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

router.get("/tmux/windows/:windowName/create", async (ctx: RouterContext) => {
  const windowName = ctx.params.windowName
  if (!windowName) {
    ctx.response.status = 500
    return
  }
  await createWindow(windowName)
  ctx.response.body = {
    status: 200,
  };
});

router.get("/tmux/windows/:windowName/switch", async (ctx: RouterContext) => {
  const windowName = ctx.params.windowName
  if (!windowName) {
    ctx.response.status = 500
    return
  }
  await switchWindow(windowName)
  ctx.response.body = {
    status: 200,
  };
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 9281 });
