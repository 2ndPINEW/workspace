#!/bin/zsh
# zsh ~/dev/github.com/2ndPINEW/workspace/tmux_layout/add.sh hiragana ../HiraganaParser

if [ $# != 2 ]; then
	echo 引数が足りません: $*
	exit 1
fi

cd ~/dev/github.com/2ndPINEW/workspace

if [ ! -e $2 ]; then
	echo パスが存在しません
  exit 1
fi

echo "{
	\"folders\": [
		{
			\"path\": \"$2\"
		}
	],
	\"settings\": {}
}
" > $1.code-workspace

# ウィンドウを作成する
tmux new-window -c $2
# ウィンドウの名前を変更
tmux rename-window "$1"
# 縦 50% の位置で分割
tmux split-window -v -p 50 -c "#{pane_current_path}"
# 横 2等分に分割
tmux split-window -h -p 50 -c "#{pane_current_path}"
tmux select-pane -t 0
tmux split-window -h -p 50 -c "#{pane_current_path}"
tmux select-pane -t 0

echo "起動時のシェルは自分で追加してください"