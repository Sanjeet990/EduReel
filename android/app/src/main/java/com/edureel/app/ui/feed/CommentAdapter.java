package com.edureel.app.ui.feed;

import android.graphics.Color;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.style.ForegroundColorSpan;
import android.text.style.StyleSpan;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.edureel.app.R;
import com.edureel.app.models.Comment;
import java.util.ArrayList;
import java.util.List;

public class CommentAdapter extends RecyclerView.Adapter<CommentAdapter.ViewHolder> {

    private List<Comment> comments = new ArrayList<>();
    private String currentUserId;
    private OnCommentInteractionListener listener;

    public interface OnCommentInteractionListener {
        void onReply(Comment comment);
        void onLike(Comment comment, TextView btnLike, TextView tvLikeCount);
        void onProfileClick(String userId);
    }

    public CommentAdapter(String currentUserId, OnCommentInteractionListener listener) {
        this.currentUserId = currentUserId;
        this.listener = listener;
    }

    public void setComments(List<Comment> newComments) {
        this.comments = newComments;
        notifyDataSetChanged();
    }

    public void addComments(List<Comment> newComments) {
        int start = this.comments.size();
        this.comments.addAll(newComments);
        notifyItemRangeInserted(start, newComments.size());
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_comment, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Comment comment = comments.get(position);

        String name = "User";
        if (comment.getUser() != null && comment.getUser().containsKey("name")) {
            name = comment.getUser().get("name");
        }

        holder.tvAvatar.setText(name.substring(0, 1).toUpperCase());

        // Inline username and comment text
        SpannableStringBuilder builder = new SpannableStringBuilder();
        builder.append(name);
        builder.setSpan(new ForegroundColorSpan(Color.parseColor("#836EF8")), 0, name.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        builder.setSpan(new StyleSpan(android.graphics.Typeface.BOLD), 0, name.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        builder.setSpan(new android.text.style.ClickableSpan() {
            @Override
            public void onClick(@NonNull View widget) {
                if (comment.getUser() != null && comment.getUser().containsKey("_id")) {
                    listener.onProfileClick(comment.getUser().get("_id"));
                }
            }
            @Override
            public void updateDrawState(@NonNull android.text.TextPaint ds) {
                ds.setUnderlineText(false);
            }
        }, 0, name.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        builder.append("  ").append(comment.getText());
        holder.tvCommentContent.setText(builder);
        holder.tvCommentContent.setMovementMethod(android.text.method.LinkMovementMethod.getInstance());

        // Likes
        int likes = comment.getLikedBy() != null ? comment.getLikedBy().size() : 0;
        holder.tvLikeCount.setText(String.valueOf(likes));
        
        boolean isLiked = comment.getLikedBy() != null && comment.getLikedBy().contains(currentUserId);
        holder.btnLike.setText(isLiked ? "❤️" : "🤍");

        holder.btnReply.setOnClickListener(v -> listener.onReply(comment));
        holder.btnLike.setOnClickListener(v -> listener.onLike(comment, holder.btnLike, holder.tvLikeCount));

        if (comment.getUser() != null && comment.getUser().containsKey("_id")) {
            String userId = comment.getUser().get("_id");
            holder.tvAvatar.setOnClickListener(v -> listener.onProfileClick(userId));
        }
    }

    @Override
    public int getItemCount() {
        return comments.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvAvatar, tvCommentContent, tvTime, btnLike, tvLikeCount, btnReply;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvAvatar = itemView.findViewById(R.id.tvAvatar);
            tvCommentContent = itemView.findViewById(R.id.tvCommentContent);
            tvTime = itemView.findViewById(R.id.tvTime);
            btnLike = itemView.findViewById(R.id.btnLike);
            tvLikeCount = itemView.findViewById(R.id.tvLikeCount);
            btnReply = itemView.findViewById(R.id.btnReply);
        }
    }
}
