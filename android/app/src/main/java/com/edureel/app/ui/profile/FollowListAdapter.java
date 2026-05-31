package com.edureel.app.ui.profile;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.edureel.app.R;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import android.content.Intent;
import com.edureel.app.ui.feed.PublicProfileActivity;

public class FollowListAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int TYPE_ITEM = 0;
    private static final int TYPE_LOAD_MORE = 1;

    private List<Map<String, String>> users = new ArrayList<>();
    private boolean hasMore = false;
    private OnLoadMoreListener loadMoreListener;

    public interface OnLoadMoreListener {
        void onLoadMore();
    }

    public void setOnLoadMoreListener(OnLoadMoreListener listener) {
        this.loadMoreListener = listener;
    }

    public void setUsers(List<Map<String, String>> newUsers, boolean hasMore) {
        this.users = newUsers;
        this.hasMore = hasMore;
        notifyDataSetChanged();
    }

    public void addUsers(List<Map<String, String>> newUsers, boolean hasMore) {
        int startPos = this.users.size();
        this.users.addAll(newUsers);
        this.hasMore = hasMore;
        // if hasMore was previously true, the last item was the load more button.
        // notifyItemChanged for the old button, or just notifyDataSetChanged for simplicity.
        notifyDataSetChanged();
    }

    @Override
    public int getItemViewType(int position) {
        if (position == users.size() && hasMore) {
            return TYPE_LOAD_MORE;
        }
        return TYPE_ITEM;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        if (viewType == TYPE_LOAD_MORE) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_load_more, parent, false);
            return new LoadMoreViewHolder(view);
        } else {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_user_list, parent, false);
            return new UserViewHolder(view);
        }
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        if (holder instanceof UserViewHolder) {
            Map<String, String> user = users.get(position);
            ((UserViewHolder) holder).bind(user);
        } else if (holder instanceof LoadMoreViewHolder) {
            ((LoadMoreViewHolder) holder).btnLoadMore.setOnClickListener(v -> {
                if (loadMoreListener != null) {
                    loadMoreListener.onLoadMore();
                }
            });
        }
    }

    @Override
    public int getItemCount() {
        return hasMore ? users.size() + 1 : users.size();
    }

    static class UserViewHolder extends RecyclerView.ViewHolder {
        TextView tvAvatar, tvUsername;

        UserViewHolder(@NonNull View itemView) {
            super(itemView);
            tvAvatar = itemView.findViewById(R.id.tvAvatar);
            tvUsername = itemView.findViewById(R.id.tvUsername);
        }

        void bind(Map<String, String> user) {
            String name = user.get("name") != null ? user.get("name") : "User";
            tvUsername.setText(name);
            tvAvatar.setText(name.substring(0, 1).toUpperCase());

            itemView.setOnClickListener(v -> {
                String userId = user.get("_id");
                if (userId != null) {
                    Intent intent = new Intent(itemView.getContext(), PublicProfileActivity.class);
                    intent.putExtra(PublicProfileActivity.EXTRA_USER_ID, userId);
                    itemView.getContext().startActivity(intent);
                }
            });
        }
    }

    static class LoadMoreViewHolder extends RecyclerView.ViewHolder {
        Button btnLoadMore;

        LoadMoreViewHolder(@NonNull View itemView) {
            super(itemView);
            btnLoadMore = itemView.findViewById(R.id.btnLoadMore);
        }
    }
}
