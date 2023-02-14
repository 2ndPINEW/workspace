#!/bin/zsh
# セッションの名前
SESSION_NAME=personal

# ワークスペースの数
WORKSPACE_COUNT=11

# ワークスペース(タブ)の名前
WORKSPACE_NAME=(
  tmux
  astro
  blog
  workspace
  workspace-switcher
  skill
  hiragana
  valwind
  blog-api
  raycast
  blog-front
)




# ワークスペースのパス
WORKSPACE_PATH=(
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../../../../.config/tmux
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../astro
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../blog
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/.
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../vscode-workspace-switcher-with-terminal
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../skill
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../HiraganaParser
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../../KOSENation/valwind
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../blog-api
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../../FukeKazki/raycast-scripts
  /Users/takaseeito/dev/github.com/2ndPINEW/workspace/../blog-front
)




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
  
  # ウィンドウの名前を変更
  tmux rename-window "$WORKSPACE_NAME[$I]"
  # 縦 50% の位置で分割
  # tmux split-window -v -p 50 -c "#{pane_current_path}"
  # 横 2等分に分割
  tmux split-window -h -p 50 -c "#{pane_current_path}"
  tmux select-pane -t 0
  # tmux split-window -h -p 50 -c "#{pane_current_path}"
  # tmux select-pane -t 0
done
# 最初のウィンドウにフォーカスする
tmux select-window -t 0

# 現在のターミナルをセッションにアタッチする
tmux attach -t $SESSION_NAME
