#!/bin/zsh
# セッションの名前
SESSION_NAME=WORKSPACE_MANAGER

source src/shell/workspace.conf

# 同じレイアウトで複数のワークスペースを作成
# 同じレイアウトで複数のワークスペースを作成
for ((I=1; I<=$WORKSPACE_COUNT; I++)); do
  if [ $I = 1 ]; then
    # 1つ目のワークスペースはセッション作成と同時に作成
    tmux new-session -d -A -s "$SESSION_NAME" -c $WORKSPACE_PATH[$I] -x 64 -y 64
  else
    # 以降のワークスペースはウィンドウを作成
    tmux new-window -c $WORKSPACE_PATH[$I]
  fi

  if [ $WORKSPACE_NAME[$I] = 'workspace' ]; then
    tmux send-keys 'deno task serve' Enter
  fi

    if [ $WORKSPACE_NAME[$I] = 'lyric-crawler' ]; then
    tmux send-keys 'deno run -A server.ts' Enter
  fi
  
  # ウィンドウの名前を変更
  tmux rename-window "$WORKSPACE_NAME[$I]"

  zsh src/shell/make_layout.sh
done
# 最初のウィンドウにフォーカスする
tmux select-window -t 0

# 現在のターミナルをセッションにアタッチする
tmux attach -t $SESSION_NAME
