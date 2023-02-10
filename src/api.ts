import { Application, Router, RouterContext } from "https://deno.land/x/oak@v6.5.0/mod.ts";

const app = new Application();
const router = new Router();

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${hostname ??
      "localhost"}:${port}`,
  );
});

app.addEventListener("error", (evt) => {
  console.log(evt.error);
});

router.get('/', async (ctx: RouterContext) => {
  const p = Deno.run({ cmd: ["tmux", "lsw"], stdout: 'piped' });
  await p.status()
  const stdout = new TextDecoder().decode(await p.output())
  const lines = stdout.split('\n')
  const activeLine = lines.find(line => line.includes('(active)'))
  const windowName = activeLine?.split(': ')[1].split(' (')[0]
  const escapedWindowName = windowName?.endsWith('*') || windowName?.endsWith('-') ? windowName.slice(0, windowName.length - 1) : ''
  ctx.response.body = escapedWindowName
})

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8080 });