# 縦 50% の位置で分割
# tmux split-window -v -p 50 -c "#{pane_current_path}"
# 横 2等分に分割
tmux split-window -h -p 50 -c "#{pane_current_path}"
tmux select-pane -t 0
# tmux split-window -h -p 50 -c "#{pane_current_path}"
# tmux select-pane -t 0