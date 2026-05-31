package com.edureel.app.ui.feed;

import com.edureel.app.managers.FollowManager;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.os.Handler;
import android.os.Looper;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.core.view.GestureDetectorCompat;

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
        void onComment(Video video, TextView tvCommentCount);
        void onShare(Video video);
        void onSave(Video video, ImageView btnSave);
        void onFollow(Video video, TextView btnFollow);
        void onProfileClick(String userId);
    }

    private List<Video> videos = new ArrayList<>();
    private OnVideoInteractionListener listener;
    private boolean isLooping = false;

    public void setLooping(boolean looping) {
        this.isLooping = looping;
    }

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
        if (videos == null || videos.isEmpty()) return null;
        int actualPosition = isLooping ? position % videos.size() : position;
        if (actualPosition >= 0 && actualPosition < videos.size()) {
            return videos.get(actualPosition);
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
            int actualPosition = isLooping && !videos.isEmpty() ? position % videos.size() : position;
            Video video = videos.get(actualPosition);
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
        int actualPosition = isLooping && !videos.isEmpty() ? position % videos.size() : position;
        Video video = videos.get(actualPosition);
        holder.bind(video, listener);
    }

    @Override
    public int getItemCount() {
        if (videos == null || videos.isEmpty()) return 0;
        return isLooping ? Integer.MAX_VALUE : videos.size();
    }

    public static String formatCount(int count) {
        if (count >= 1000000) return String.format("%.1fM", count / 1000000.0);
        if (count >= 1000) return String.format("%.1fK", count / 1000.0);
        return String.valueOf(count);
    }

    public static class VideoViewHolder extends RecyclerView.ViewHolder {
        public PlayerView playerView;
        public ProgressBar progressBar;
        private TextView tvTitle, tvDescription, tvSubject;
        private TextView tvLikeCount, tvCommentCount;
        private ImageView btnLike, btnComment, btnShare, btnSave;
        public TextView tvAvatar, tvChannelName, btnFollow;
        public View touchOverlay;
        public ImageView ivPlayPauseIndicator;
        public TextView tvSpeedIndicator;
        private float initialTouchX, initialTouchY;

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
            touchOverlay = itemView.findViewById(R.id.touchOverlay);
            ivPlayPauseIndicator = itemView.findViewById(R.id.ivPlayPauseIndicator);
            tvSpeedIndicator = itemView.findViewById(R.id.tvSpeedIndicator);
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

            if (video.isLiked()) {
                btnLike.setColorFilter(android.graphics.Color.RED);
            } else {
                btnLike.clearColorFilter();
            }

            if (btnSave != null) {
                if (video.isSaved()) {
                    btnSave.setColorFilter(android.graphics.Color.YELLOW);
                } else {
                    btnSave.clearColorFilter();
                }
            }

            // Interactions
            if (listener != null) {
                btnLike.setOnClickListener(v -> listener.onLike(video, btnLike, tvLikeCount));
                btnComment.setOnClickListener(v -> listener.onComment(video, tvCommentCount));
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
            
            if (touchOverlay != null) {
                GestureDetectorCompat gestureDetector = new GestureDetectorCompat(touchOverlay.getContext(), new GestureDetector.SimpleOnGestureListener() {
                    @Override
                    public boolean onSingleTapConfirmed(MotionEvent e) {
                        if (playerView.getPlayer() != null) {
                            boolean isPlaying = playerView.getPlayer().isPlaying();
                            if (isPlaying) {
                                playerView.getPlayer().pause();
                                ivPlayPauseIndicator.setImageResource(android.R.drawable.ic_media_pause);
                            } else {
                                playerView.getPlayer().play();
                                ivPlayPauseIndicator.setImageResource(android.R.drawable.ic_media_play);
                            }
                            ivPlayPauseIndicator.setVisibility(View.VISIBLE);
                            ivPlayPauseIndicator.setAlpha(1f);
                            ivPlayPauseIndicator.animate().alpha(0f).setDuration(800).withEndAction(() -> ivPlayPauseIndicator.setVisibility(View.GONE)).start();
                        }
                        return true;
                    }

                    @Override
                    public boolean onDoubleTap(MotionEvent e) {
                        if (btnLike != null && !video.isLiked()) {
                            btnLike.performClick();
                        }
                        showHeartAnimation(touchOverlay, e.getX(), e.getY());
                        return true;
                    }

                    @Override
                    public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
                        if (e1 != null && e2 != null) {
                            float diffX = e2.getX() - e1.getX();
                            float diffY = e2.getY() - e1.getY();
                            // Maximum sensitivity: Ignore angle/diffY completely. Just check if it's a quick right-to-left flick.
                            if (diffX < -20 && velocityX < -200) { // Swipe Right to Left
                                if (listener != null && video.getUploader() != null) {
                                    listener.onProfileClick(video.getUploader()._id);
                                }
                                return true;
                            }
                        }
                        return false;
                    }
                    
                    @Override
                    public boolean onDown(MotionEvent e) {
                        return true; // Must return true to receive subsequent events
                    }
                });

                Handler handler = new Handler(Looper.getMainLooper());
                Runnable speedRunnable = () -> {
                    if (playerView.getPlayer() != null) {
                        playerView.getPlayer().setPlaybackSpeed(2f);
                        tvSpeedIndicator.setVisibility(View.VISIBLE);
                    }
                };

                touchOverlay.setOnTouchListener((v, event) -> {
                    gestureDetector.onTouchEvent(event);
                    
                    int width = v.getWidth();
                    int height = v.getHeight();
                    // 25% top right corner: right 25% width, top 25% height
                    boolean inTopRight = (event.getX() > width * 0.75f) && (event.getY() < height * 0.25f);
                    
                    switch (event.getAction()) {
                        case MotionEvent.ACTION_DOWN:
                            initialTouchX = event.getX();
                            initialTouchY = event.getY();
                            if (inTopRight) {
                                handler.postDelayed(speedRunnable, 300);
                            }
                            break;
                        case MotionEvent.ACTION_MOVE:
                            float currentX = event.getX();
                            float currentY = event.getY();
                            float diffXMove = Math.abs(currentX - initialTouchX);
                            float diffYMove = Math.abs(currentY - initialTouchY);
                            // If horizontal drag intent is detected early, lock the ViewPager2 to prevent vertical stutter
                            if (diffXMove > diffYMove && diffXMove > 20) {
                                v.getParent().requestDisallowInterceptTouchEvent(true);
                            }
                            break;
                        case MotionEvent.ACTION_UP:
                        case MotionEvent.ACTION_CANCEL:
                            handler.removeCallbacks(speedRunnable);
                            if (playerView.getPlayer() != null) {
                                playerView.getPlayer().setPlaybackSpeed(1f);
                            }
                            tvSpeedIndicator.setVisibility(View.GONE);
                            break;
                    }
                    return true;
                });
            }
        }

        private void showHeartAnimation(View anchorView, float x, float y) {
            if (anchorView.getParent() instanceof ViewGroup) {
                ViewGroup parent = (ViewGroup) anchorView.getParent();
                ImageView heart = new ImageView(anchorView.getContext());
                heart.setImageResource(R.drawable.ic_heart);
                
                int size = (int) (100 * anchorView.getResources().getDisplayMetrics().density);
                ViewGroup.LayoutParams params = new ViewGroup.LayoutParams(size, size);
                heart.setLayoutParams(params);
                
                heart.setX(x - size / 2f);
                heart.setY(y - size / 2f);
                
                // Instagram-style bright pink/red
                heart.setColorFilter(0xFFE91E63, android.graphics.PorterDuff.Mode.SRC_IN);
                
                // Slight random rotation
                heart.setRotation((float)(Math.random() * 30 - 15));
                
                parent.addView(heart);
                
                heart.setScaleX(0f);
                heart.setScaleY(0f);
                
                heart.animate()
                     .scaleX(1.2f)
                     .scaleY(1.2f)
                     .setDuration(300)
                     .setInterpolator(new android.view.animation.OvershootInterpolator())
                     .withEndAction(() -> {
                         heart.animate()
                              .translationY(heart.getY() - 150)
                              .alpha(0f)
                              .setDuration(500)
                              .setStartDelay(200)
                              .withEndAction(() -> parent.removeView(heart))
                              .start();
                     })
                     .start();
            }
        }
    }
}
