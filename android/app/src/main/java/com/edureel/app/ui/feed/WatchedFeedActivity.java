package com.edureel.app.ui.feed;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.MediaSource;
import androidx.media3.exoplayer.hls.HlsMediaSource;
import androidx.recyclerview.widget.RecyclerView;
import androidx.viewpager2.widget.ViewPager2;

import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.Video;
import com.edureel.app.utils.TokenManager;

import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WatchedFeedActivity extends AppCompatActivity {

    private ViewPager2 viewPager;
    private VideoAdapter videoAdapter;
    private ExoPlayer exoPlayer;
    private TokenManager tokenManager;
    private ApiService apiService;
    private int currentPlayingIndex = -1;
    private final Set<String> sessionViewReported = new HashSet<>();

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_watched_feed);

        tokenManager = new TokenManager(this);
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);

        viewPager = findViewById(R.id.viewPager);
        
        android.widget.ImageView btnBack = findViewById(R.id.btnBack);
        btnBack.setOnClickListener(v -> finish());

        videoAdapter = new VideoAdapter();
        videoAdapter.setOnVideoInteractionListener(new VideoAdapter.OnVideoInteractionListener() {
            @Override
            public void onLike(Video video, ImageView btnLike, TextView tvLikeCount) {
                apiService.likeVideo(video.getId()).enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
                    @Override
                    public void onResponse(Call<ApiResponse<Map<String, Object>>> call, Response<ApiResponse<Map<String, Object>>> response) {
                        if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                            Map<String, Object> data = response.body().getData();
                            boolean isLiked = Boolean.TRUE.equals(data.get("isLiked"));
                            boolean wasLiked = video.isLiked();
                            if (isLiked != wasLiked) {
                                video.setLiked(isLiked);
                                video.setLikeCount(video.getLikeCount() + (isLiked ? 1 : -1));
                                tvLikeCount.setText(VideoAdapter.formatCount(video.getLikeCount()));
                            }
                            if (isLiked) {
                                btnLike.setColorFilter(android.graphics.Color.RED);
                            } else {
                                btnLike.clearColorFilter();
                            }
                        }
                    }
                    @Override
                    public void onFailure(Call<ApiResponse<Map<String, Object>>> call, Throwable t) {}
                });
            }

            @Override
            public void onComment(Video video, TextView tvCommentCount) {
                CommentBottomSheetFragment bottomSheet = new CommentBottomSheetFragment(video.getId());
                bottomSheet.setOnCommentAddedListener(() -> {
                    video.setCommentCount(video.getCommentCount() + 1);
                    tvCommentCount.setText(VideoAdapter.formatCount(video.getCommentCount()));
                });
                bottomSheet.show(getSupportFragmentManager(), "CommentBottomSheet");
            }

            @Override
            public void onShare(Video video) {
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/plain");
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, "Check out this EduReel!");
                shareIntent.putExtra(Intent.EXTRA_TEXT, "Watch this awesome video: " + video.getTitle() + "\n\nhttps://edureel.app/video/" + video.getId());
                startActivity(Intent.createChooser(shareIntent, "Share Video"));
            }

            @Override
            public void onSave(Video video, ImageView btnSave) {
                apiService.saveVideo(video.getId()).enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
                    @Override
                    public void onResponse(Call<ApiResponse<Map<String, Object>>> call, Response<ApiResponse<Map<String, Object>>> response) {
                        if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                            Map<String, Object> data = response.body().getData();
                            boolean isSaved = Boolean.TRUE.equals(data.get("isSaved"));
                            video.setSaved(isSaved);
                            if (isSaved) {
                                btnSave.setColorFilter(android.graphics.Color.YELLOW);
                            } else {
                                btnSave.clearColorFilter();
                            }
                        }
                    }
                    @Override
                    public void onFailure(Call<ApiResponse<Map<String, Object>>> call, Throwable t) {}
                });
            }

            @Override
            public void onFollow(Video video, TextView btnFollow) {
                if (video.getUploader() == null || video.getUploader()._id == null) return;
                String uploaderId = video.getUploader()._id;
                
                boolean currentStatus = com.edureel.app.managers.FollowManager.getInstance().isFollowing(uploaderId, video.getUploader().isFollowing);
                boolean newStatus = !currentStatus;
                if (videoAdapter != null) {
                    videoAdapter.updateFollowStatus(uploaderId, newStatus);
                }
                
                apiService.toggleFollow(uploaderId).enqueue(new Callback<ApiResponse<Map<String, Boolean>>>() {
                    @Override
                    public void onResponse(Call<ApiResponse<Map<String, Boolean>>> call, Response<ApiResponse<Map<String, Boolean>>> response) {
                        if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                            Boolean followingObj = response.body().getData().get("isFollowing");
                            boolean actualStatus = followingObj != null ? followingObj : false;
                            
                            if (actualStatus != newStatus && videoAdapter != null) {
                                videoAdapter.updateFollowStatus(uploaderId, actualStatus);
                            }
                        }
                    }
                    @Override
                    public void onFailure(Call<ApiResponse<Map<String, Boolean>>> call, Throwable t) {
                        if (videoAdapter != null) {
                            videoAdapter.updateFollowStatus(uploaderId, !newStatus);
                        }
                        Toast.makeText(WatchedFeedActivity.this, "Network error", Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onProfileClick(String userId) {
                if (userId != null) {
                    Intent profileIntent = new Intent(WatchedFeedActivity.this, PublicProfileActivity.class);
                    profileIntent.putExtra(PublicProfileActivity.EXTRA_USER_ID, userId);
                    startActivity(profileIntent);
                }
            }
        });
        viewPager.setAdapter(videoAdapter);

        setupViewPager();
        loadWatchedVideos();
    }

    private void setupViewPager() {
        viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                super.onPageSelected(position);
                playVideoAtPosition(position);

                if (videoAdapter != null && videoAdapter.getItemCount() > 0) {
                    VideoPreloader.prefetchSurroundingVideos(WatchedFeedActivity.this, videoAdapter.getVideos(), position);
                }
            }
        });
    }

    private void loadWatchedVideos() {
        apiService.getHistory().enqueue(new Callback<ApiResponse<List<Video>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Video>>> call, Response<ApiResponse<List<Video>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Video> videos = response.body().getData();
                    if (videos != null && !videos.isEmpty()) {
                        videoAdapter.setVideos(videos);
                        viewPager.post(() -> playVideoAtPosition(0));
                    } else {
                        Toast.makeText(WatchedFeedActivity.this, "No videos watched today", Toast.LENGTH_SHORT).show();
                        finish();
                    }
                } else {
                    Toast.makeText(WatchedFeedActivity.this, "Failed to load history", Toast.LENGTH_SHORT).show();
                    finish();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Video>>> call, Throwable t) {
                Toast.makeText(WatchedFeedActivity.this, "Network Error", Toast.LENGTH_SHORT).show();
                finish();
            }
        });
    }

    private void playVideoAtPosition(int position) {
        if (currentPlayingIndex == position) return;
        reportCurrentVideoProgress();

        Video video = videoAdapter.getVideoAt(position);
        if (video == null || video.getHlsUrl() == null) return;

        RecyclerView recyclerView = (RecyclerView) viewPager.getChildAt(0);
        
        recyclerView.post(() -> {
            RecyclerView.ViewHolder rawHolder = recyclerView.findViewHolderForAdapterPosition(position);

            if (rawHolder instanceof VideoAdapter.VideoViewHolder) {
                VideoAdapter.VideoViewHolder holder = (VideoAdapter.VideoViewHolder) rawHolder;

                if (exoPlayer != null) {
                    exoPlayer.release();
                }
                
                exoPlayer = new ExoPlayer.Builder(this).build();
                exoPlayer.setRepeatMode(Player.REPEAT_MODE_ONE);

                String hlsUrl = video.getHlsUrl();
                if (hlsUrl.startsWith("/hls")) {
                    hlsUrl = com.edureel.app.utils.Constants.SERVER_URL + hlsUrl;
                }

                MediaItem mediaItem = MediaItem.fromUri(Uri.parse(hlsUrl));
                MediaSource mediaSource = new HlsMediaSource.Factory(VideoPreloader.getCacheDataSourceFactory())
                        .createMediaSource(mediaItem);
                
                exoPlayer.setMediaSource(mediaSource);
                holder.playerView.setPlayer(exoPlayer);
                
                exoPlayer.addListener(new Player.Listener() {
                    @Override
                    public void onPlaybackStateChanged(int playbackState) {
                        if (playbackState == Player.STATE_READY) {
                            holder.progressBar.setVisibility(View.GONE);
                            reportView(video, 3);
                        } else if (playbackState == Player.STATE_BUFFERING) {
                            holder.progressBar.setVisibility(View.VISIBLE);
                        }
                    }
                });

                exoPlayer.prepare();
                exoPlayer.play();
                currentPlayingIndex = position;
            }
        });
    }

    @Override
    public void onPause() {
        super.onPause();
        reportCurrentVideoProgress();
        if (exoPlayer != null) exoPlayer.pause();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (exoPlayer != null) exoPlayer.play();
        if (videoAdapter != null) videoAdapter.syncFollowStateWithManager();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        reportCurrentVideoProgress();
        if (exoPlayer != null) {
            exoPlayer.release();
            exoPlayer = null;
        }
    }

    private void reportCurrentVideoProgress() {
        if (currentPlayingIndex < 0) return;
        Video currentVideo = videoAdapter.getVideoAt(currentPlayingIndex);
        if (currentVideo == null || currentVideo.getId() == null || exoPlayer == null) return;
        int watchedSeconds = Math.max(1, (int) (exoPlayer.getCurrentPosition() / 1000));
        reportView(currentVideo, watchedSeconds);
    }

    private void reportView(Video video, int watchedSeconds) {
        if (video == null || video.getId() == null) return;
        if (watchedSeconds >= 3) {
            sessionViewReported.add(video.getId());
        } else if (sessionViewReported.contains(video.getId())) {
            return;
        }
        Map<String, Integer> body = new java.util.HashMap<>();
        body.put("watchedSeconds", watchedSeconds);
        apiService.viewVideo(video.getId(), body).enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {}
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {}
        });
    }
}
