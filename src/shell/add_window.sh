#!/bin/zsh
# zsh add.sh hiragana ../HiraganaParser

if [ $# != 2 ]; then
	echo 引数が足りません: $*
	exit 1
fi

# ウィンドウを作成する
tmux new-window -c $2
# ウィンドウの名前を変更
tmux rename-window "$1"

zsh src/shell/make_layout.sh