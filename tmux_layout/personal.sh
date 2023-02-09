#!/bin/zsh
# セッションの名前
SESSION_NAME=personal

# ワークスペースの数
WORKSPACE_COUNT=8

# ワークスペース(タブ)の名前
WORKSPACE_NAME=(
  blog
  blog-front
  skill
  astro
  raycast
  hiragana
  valwind
  workspace
)

# ワークスペースのパス
WORKSPACE_PATH=(
  ~/dev/github.com/2ndPINEW/blog
  ~/dev/github.com/2ndPINEW/blog-front
  ~/dev/github.com/2ndPINEW/skill
  ~/dev/github.com/2ndPINEW/astro
  ~/dev/github.com/FukeKazki/raycast-scripts
  ~/dev/github.com/FukeKazki/HiraganaParser
  ~/dev/github.com/KOSENation/valwind
  ~/dev/github.com/2ndPINEW/workspace
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
  # ウィンドウの名前を変更
  tmux rename-window "$WORKSPACE_NAME[$I]"
  # 縦 50% の位置で分割
  tmux split-window -v -p 50 -c "#{pane_current_path}"
  # 横 2等分に分割
  tmux split-window -h -p 50 -c "#{pane_current_path}"
  tmux select-pane -t 0
  tmux split-window -h -p 50 -c "#{pane_current_path}"
  tmux select-pane -t 0
done
# 最初のウィンドウにフォーカスする
tmux select-window -t 0

# 現在のターミナルをセッションにアタッチする
tmux attach -t $SESSION_NAME
