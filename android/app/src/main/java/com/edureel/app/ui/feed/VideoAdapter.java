package com.edureel.app.ui.feed;

import com.edureel.app.managers.FollowManager;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.media3.ui.PlayerView;
import androidx.recyclerview.widget.RecyclerView;

import com.edureel.app.R;
import com.edureel.app.models.Video;

import java.util.ArrayList;
import java.util.List;

public class VideoAdapter extends RecyclerView.Adapter<VideoAdapter.VideoViewHolder> {

    public interface OnVideoInteractionListener {
        void onLike(Video video, ImageView btnLike, TextView tvLikeCount);
        void onComment(Video video);
        void onShare(Video video);
        void onSave(Video video, ImageView btnSave);
        void onFollow(Video video, TextView btnFollow);
        void onProfileClick(String userId);
    }

    private List<Video> videos = new ArrayList<>();
    private OnVideoInteractionListener listener;

    public void setOnVideoInteractionListener(OnVideoInteractionListener listener) {
        this.listener = listener;
    }

    public void setVideos(List<Video> newVideos) {
        this.videos = newVideos;
        notifyDataSetChanged();
    }

    public List<Video> getVideos() {
        return videos;
    }

    public void addVideos(List<Video> newVideos) {
        int startPos = this.videos.size();
        this.videos.addAll(newVideos);
        notifyItemRangeInserted(startPos, newVideos.size());
    }

    public Video getVideoAt(int position) {
        if (position >= 0 && position < videos.size()) {
            return videos.get(position);
        }
        return null;
    }
    
    public static void setFollowButtonUI(TextView btnFollow, boolean isFollowing) {
        if (btnFollow == null) return;
        btnFollow.setBackgroundResource(R.drawable.bg_rounded_accent);
        if (isFollowing) {
            btnFollow.setText("Following");
            btnFollow.setTextColor(0xFFFFFFFF);
            btnFollow.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0x88444444)); // Translucent dark gray
        } else {
            btnFollow.setText("Follow");
            btnFollow.setTextColor(0xFFFFFFFF);
            btnFollow.setBackgroundTintList(null); // Reverts to original colorAccent
        }
    }
    
    public void updateFollowStatus(String uploaderId, boolean isFollowing) {
        FollowManager.getInstance().setFollowing(uploaderId, isFollowing);
        for (int i = 0; i < videos.size(); i++) {
            Video v = videos.get(i);
            if (v.getUploader() != null && uploaderId.equals(v.getUploader()._id)) {
                v.getUploader().isFollowing = isFollowing;
                notifyItemChanged(i, "FOLLOW_UPDATE");
            }
        }
    }
    
    public void syncFollowStateWithManager() {
        for (int i = 0; i < videos.size(); i++) {
            Video v = videos.get(i);
            if (v.getUploader() != null) {
                boolean actualFollowing = FollowManager.getInstance().isFollowing(v.getUploader()._id, v.getUploader().isFollowing);
                if (actualFollowing != v.getUploader().isFollowing) {
                    v.getUploader().isFollowing = actualFollowing;
                    notifyItemChanged(i, "FOLLOW_UPDATE");
                }
            }
        }
    }

    @NonNull
    @Override
    public VideoViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_video, parent, false);
        return new VideoViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull VideoViewHolder holder, int position, @NonNull List<Object> payloads) {
        if (!payloads.isEmpty() && payloads.contains("FOLLOW_UPDATE")) {
            Video video = videos.get(position);
            if (video.getUploader() != null) {
                boolean isFollowing = FollowManager.getInstance().isFollowing(video.getUploader()._id, video.getUploader().isFollowing);
                setFollowButtonUI(holder.btnFollow, isFollowing);
            }
        } else {
            super.onBindViewHolder(holder, position, payloads);
        }
    }

    @Override
    public void onBindViewHolder(@NonNull VideoViewHolder holder, int position) {
        Video video = videos.get(position);
        holder.bind(video, listener);
    }

    @Override
    public int getItemCount() {
        return videos.size();
    }

    public static class VideoViewHolder extends RecyclerView.ViewHolder {
        public PlayerView playerView;
        public ProgressBar progressBar;
        private TextView tvTitle, tvDescription, tvSubject;
        private TextView tvLikeCount, tvCommentCount;
        private ImageView btnLike, btnComment, btnShare, btnSave;
        public TextView tvAvatar, tvChannelName, btnFollow;

        public VideoViewHolder(@NonNull View itemView) {
            super(itemView);
            playerView = itemView.findViewById(R.id.playerView);
            progressBar = itemView.findViewById(R.id.progressBar);
            tvTitle = itemView.findViewById(R.id.tvTitle);
            tvDescription = itemView.findViewById(R.id.tvDescription);
            tvSubject = itemView.findViewById(R.id.tvSubject);
            tvLikeCount = itemView.findViewById(R.id.tvLikeCount);
            tvCommentCount = itemView.findViewById(R.id.tvCommentCount);
            btnLike = itemView.findViewById(R.id.btnLike);
            btnComment = itemView.findViewById(R.id.btnComment);
            btnShare = itemView.findViewById(R.id.btnShare);
            btnSave = itemView.findViewById(R.id.btnSave);
            tvAvatar = itemView.findViewById(R.id.tvAvatar);
            tvChannelName = itemView.findViewById(R.id.tvChannelName);
            btnFollow = itemView.findViewById(R.id.btnFollow);
        }

        public void bind(Video video, OnVideoInteractionListener listener) {
            tvTitle.setText(video.getTitle() != null ? video.getTitle() : "Untitled");
            
            if (video.getDescription() != null && !video.getDescription().trim().isEmpty()) {
                tvDescription.setVisibility(View.VISIBLE);
                tvDescription.setText(video.getDescription());
                
                // Reset to default collapsed state for recycled views
                tvDescription.setMaxLines(2);
                tvDescription.setBackground(null);
                tvDescription.setPadding(0, 0, 0, 0);
                
                tvDescription.setOnClickListener(v -> {
                    if (tvDescription.getMaxLines() == 2) {
                        tvDescription.setMaxLines(Integer.MAX_VALUE);
                        int p = (int) (12 * tvDescription.getResources().getDisplayMetrics().density);
                        tvDescription.setPadding(p, p, p, p);
                    } else {
                        tvDescription.setMaxLines(2);
                        tvDescription.setBackground(null);
                        tvDescription.setPadding(0, 0, 0, 0);
                    }
                });
            } else {
                tvDescription.setVisibility(View.GONE);
            }
            
            tvSubject.setText(video.getSubject() != null ? "#" + video.getSubject() : "#General");
            
            // Channel info from populated uploader
            if (video.getUploader() != null) {
                tvChannelName.setText(video.getUploader().name != null ? video.getUploader().name : "Unknown");
                if (video.getUploader().avatar != null) {
                    tvAvatar.setText("");
                    // We need to load image with Glide, but since we don't have glide context here directly,
                    // we might just keep the initials logic if Glide isn't imported. But let's assume we can use Glide or just initials.
                    // For now, let's use initials.
                    String name = video.getUploader().name != null ? video.getUploader().name : "U";
                    tvAvatar.setText(name.substring(0, 1).toUpperCase());
                } else {
                    String name = video.getUploader().name != null ? video.getUploader().name : "U";
                    tvAvatar.setText(name.substring(0, 1).toUpperCase());
                }
                
                View.OnClickListener profileClick = v -> {
                    if (listener != null) listener.onProfileClick(video.getUploader()._id);
                };
                tvChannelName.setOnClickListener(profileClick);
                tvAvatar.setOnClickListener(profileClick);
                
                if (btnFollow != null) {
                    boolean isFollowing = FollowManager.getInstance().isFollowing(video.getUploader()._id, video.getUploader().isFollowing);
                    setFollowButtonUI(btnFollow, isFollowing);
                }
                
            } else {
                tvAvatar.setText("ER");
                tvChannelName.setText("EduReel");
            }
            
            tvLikeCount.setText(formatCount(video.getLikeCount()));
            tvCommentCount.setText(formatCount(video.getCommentCount()));

            // Interactions
            if (listener != null) {
                btnLike.setOnClickListener(v -> listener.onLike(video, btnLike, tvLikeCount));
                btnComment.setOnClickListener(v -> listener.onComment(video));
                btnShare.setOnClickListener(v -> listener.onShare(video));
                if (btnSave != null) {
                    btnSave.setOnClickListener(v -> listener.onSave(video, btnSave));
                }
                if (btnFollow != null) {
                    btnFollow.setOnClickListener(v -> listener.onFollow(video, btnFollow));
                }
            }

            // Reset player view for new binding
            playerView.setPlayer(null);
            progressBar.setVisibility(View.VISIBLE);
        }
        private String formatCount(int count) {
            if (count >= 1000000) return String.format("%.1fm", count / 1000000.0);
            if (count >= 1000) return String.format("%.1fk", count / 1000.0);
            return String.valueOf(count);
        }
    }
}
