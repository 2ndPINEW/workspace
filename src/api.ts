import {
  Application,
  Router,
  RouterContext,
} from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import fallback from "./fallback.json" assert { type: "json" };

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

router.post("/switch", async (ctx: RouterContext) => {
  const body = await ctx.request.body();
  const json = await body.value;
  const windowName = json.window_name;
  if (windowName) {
    Deno.run({ cmd: ["tmux", "selectw", "-t", windowName] });
  }
  ctx.response.body = "";
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 9281 });
