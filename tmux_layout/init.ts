import { parse } from "https://deno.land/std@0.66.0/flags/mod.ts";
import { update } from './update.ts'

// deno run init.ts -g git@github.com -n hoge
// deno run init.ts -l ~/dev

// git@github.com:2ndPINEW/hoge.git
const gitSshMatcher = /git@(?<host>.+):(?<user>.+)\/(?<repo>.+)\.git/;

const main = async () => {
  const parsedArgs = parse(Deno.args);

  if (parsedArgs.help || parsedArgs.h) {
    console.log('usage: deno run init.ts -g {your git repository}')
    return
  }
  
  const type = parsedArgs.g ? 'git' : 'local'
  
  if (type === 'git') {
    const group = parsedArgs.g.match(gitSshMatcher)?.groups
    const ghqGet = Deno.run({ cmd: ["ghq", "get", parsedArgs.g], stdout: "piped" });
    const ghqStatus = await ghqGet.status()
    if (ghqStatus.code !== 0) {
      console.log('ghq get error')
      return
    }
    const name = parsedArgs.n || group.repo
    const savePath = `../../../${group.host}/${group.user}/${group.repo}`
    const codeWorkspace = `{
      "folders": [
        {
          "path": "${savePath}"
        }
      ],
      "settings": {}
    }
    `
    await Deno.writeTextFile(`${name}.code-workspace`, codeWorkspace);
    await update()

    const add = Deno.run({ cmd: ["zsh", "tmux_layout/add_window.sh", name, savePath], stdout: "piped" });
    await add.status()
  }
}

main()