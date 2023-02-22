import {
  Application,
  Router,
  RouterContext,
} from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import fallback from "./fallback.json" assert { type: "json" };

const app = new Application();
const router = new Router();

// deno-lint-ignore no-explicit-any
const sessions: { [key: string]: any } = {}

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

router.get("/active", async (ctx: RouterContext) => {
  const p = Deno.run({ cmd: ["tmux", "lsw"], stdout: "piped" });
  await p.status();
  const stdout = new TextDecoder().decode(await p.output());
  const lines = stdout.split("\n");
  const activeLine = lines.find((line) => line.includes("(active)"));
  const windowNameMatcher =
    /(?<index>[0-9]{1}): (?<name>[\w/:%#\$&\?~\.=\+\-]+)(?<current>\*?) \((?<panel>[0-9]{1}) panes\)/;
  const { name } = activeLine?.match(windowNameMatcher)?.groups as {
    name: string;
  };
  ctx.response.body = {
    window_name: name,
  };
});

router.get("/fallback", (ctx: RouterContext) => {
  ctx.response.body = fallback;
});

router.get("/sessions/:sessionName", (ctx: RouterContext) => {
  const sessionName = ctx.params.sessionName
  if (!sessionName) {
    ctx.response.status = 500
    ctx.response.body = 'need session name parameter'
    return
  }
  const session = sessions[sessionName]
  if (!session) {
    ctx.response.status = 404
    return
  }
  ctx.response.body = session
})

router.post("/sessions/:sessionName", async (ctx: RouterContext) => {
  const sessionName = ctx.params.sessionName
  if (!sessionName) {
    ctx.response.status = 500
    ctx.response.body = 'need session name parameter'
    return
  }
  const body = ctx.request.body();
  const json = await body.value;
  sessions[sessionName] = json
  ctx.response.status = 200
})

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 9281 });
