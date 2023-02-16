#!/bin/zsh
# zsh ~/dev/github.com/2ndPINEW/workspace/tmux_layout/add.sh hiragana ../HiraganaParser

if [ $# != 2 ]; then
	echo 引数が足りません: $*
	exit 1
fi

# ウィンドウを作成する
tmux new-window -c $2
# ウィンドウの名前を変更
tmux rename-window "$1"

zsh tmux_layout/make_layout.sh