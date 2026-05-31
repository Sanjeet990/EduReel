package com.edureel.app.ui.feed;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.recyclerview.widget.RecyclerView;
import androidx.viewpager2.widget.ViewPager2;

import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.PublicProfile;
import com.edureel.app.models.Video;
import com.edureel.app.utils.TokenManager;

import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CreatorFeedActivity extends AppCompatActivity {

    public static final String EXTRA_CREATOR_ID = "creator_id";
    public static final String EXTRA_INITIAL_VIDEO_ID = "initial_video_id";

    private ViewPager2 viewPager;
    private VideoAdapter videoAdapter;
    private ExoPlayer exoPlayer;
    private ApiService apiService;
    private String creatorId;
    private String initialVideoId;
    private boolean isFirstLoad = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_creator_feed);

        creatorId = getIntent().getStringExtra(EXTRA_CREATOR_ID);
        initialVideoId = getIntent().getStringExtra(EXTRA_INITIAL_VIDEO_ID);

        if (creatorId == null) {
            finish();
            return;
        }

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        viewPager = findViewById(R.id.viewPager);
        TokenManager tokenManager = new TokenManager(this);
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);

        exoPlayer = new ExoPlayer.Builder(this).build();
        exoPlayer.setRepeatMode(Player.REPEAT_MODE_ONE);

        videoAdapter = new VideoAdapter();
        viewPager.setAdapter(videoAdapter);

        setupListeners();
        setupViewPager();
        loadCreatorVideos();
    }

    private void setupListeners() {
        videoAdapter.setOnVideoInteractionListener(new VideoAdapter.OnVideoInteractionListener() {
            @Override
            public void onLike(Video video, ImageView btnLike, TextView tvLikeCount) {
                if (video == null || video.getId() == null) return;
                apiService.likeVideo(video.getId()).enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
                    @Override
                    public void onResponse(Call<ApiResponse<Map<String, Object>>> call, Response<ApiResponse<Map<String, Object>>> response) {
                        if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                            btnLike.setColorFilter(getResources().getColor(android.R.color.holo_red_dark));
                            int currentCount = Integer.parseInt(tvLikeCount.getText().toString());
                            tvLikeCount.setText(String.valueOf(currentCount + 1));
                        }
                    }
                    @Override
                    public void onFailure(Call<ApiResponse<Map<String, Object>>> call, Throwable t) {}
                });
            }

            @Override
            public void onComment(Video video) {
                // Implement comment dialog
            }

            @Override
            public void onShare(Video video) {
                if (video == null || video.getId() == null) return;
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/plain");
                shareIntent.putExtra(Intent.EXTRA_TEXT, "Check out this video: https://edureel.app/video/" + video.getId());
                startActivity(Intent.createChooser(shareIntent, "Share via"));
            }

            @Override
            public void onSave(Video video, ImageView btnSave) {
                if (video == null || video.getId() == null) return;
                apiService.saveVideo(video.getId()).enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
                    @Override
                    public void onResponse(Call<ApiResponse<Map<String, Object>>> call, Response<ApiResponse<Map<String, Object>>> response) {
                        if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                            btnSave.setColorFilter(getResources().getColor(R.color.colorAccent));
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
                        if (response.isSuccessful() && response.body() != null) {
                            Map<String, Boolean> data = response.body().getData();
                            Boolean followingObj = data != null ? data.get("isFollowing") : null;
                            boolean actualStatus = followingObj != null ? followingObj : false;
                            
                            if (actualStatus != newStatus && videoAdapter != null) {
                                videoAdapter.updateFollowStatus(uploaderId, actualStatus);
                            }
                        } else {
                            if (videoAdapter != null) {
                                videoAdapter.updateFollowStatus(uploaderId, !newStatus);
                            }
                            Toast.makeText(CreatorFeedActivity.this, "Failed to follow", Toast.LENGTH_SHORT).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<ApiResponse<Map<String, Boolean>>> call, Throwable t) {
                        if (videoAdapter != null) {
                            videoAdapter.updateFollowStatus(uploaderId, !newStatus);
                        }
                        Toast.makeText(CreatorFeedActivity.this, "Network error", Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onProfileClick(String userId) {
                if (!userId.equals(creatorId)) {
                    Intent intent = new Intent(CreatorFeedActivity.this, PublicProfileActivity.class);
                    intent.putExtra(PublicProfileActivity.EXTRA_USER_ID, userId);
                    startActivity(intent);
                }
            }
        });
    }

    private void setupViewPager() {
        viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                playVideoAt(position);
            }
        });
    }

    private void loadCreatorVideos() {
        apiService.getPublicProfile(creatorId).enqueue(new Callback<ApiResponse<PublicProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<PublicProfile>> call, Response<ApiResponse<PublicProfile>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    PublicProfile profile = response.body().getData();
                    List<Video> videos = profile.getVideos();
                    if (videos != null && !videos.isEmpty()) {
                        
                        // Populate dummy uploader info to match other feeds since the profile API might not embed it
                        for (Video v : videos) {
                            if (v.getUploader() == null) {
                                Video.Uploader uploader = new Video.Uploader();
                                uploader._id = creatorId;
                                uploader.name = profile.getName();
                                uploader.isFollowing = profile.isFollowing();
                                v.setUploader(uploader);
                            }
                        }

                        videoAdapter.setVideos(videos);

                        if (isFirstLoad && initialVideoId != null) {
                            int targetIndex = 0;
                            for (int i = 0; i < videos.size(); i++) {
                                if (initialVideoId.equals(videos.get(i).getId())) {
                                    targetIndex = i;
                                    break;
                                }
                            }
                            viewPager.setCurrentItem(targetIndex, false);
                            isFirstLoad = false;
                        } else {
                            playVideoAt(viewPager.getCurrentItem());
                        }
                    } else {
                        Toast.makeText(CreatorFeedActivity.this, "No videos found", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(CreatorFeedActivity.this, "Failed to load creator videos", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<PublicProfile>> call, Throwable t) {
                Toast.makeText(CreatorFeedActivity.this, "Error loading videos", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void playVideoAt(int position) {
        Video video = videoAdapter.getVideoAt(position);
        if (video == null || video.getHlsUrl() == null) return;
        
        String rawHlsUrl = video.getHlsUrl();
        final String finalHlsUrl = rawHlsUrl.startsWith("/hls") ? "http://192.168.29.15:5000" + rawHlsUrl : rawHlsUrl;
        
        RecyclerView recyclerView = (RecyclerView) viewPager.getChildAt(0);
        if (recyclerView != null) {
            recyclerView.post(() -> {
                RecyclerView.ViewHolder holder = recyclerView.findViewHolderForAdapterPosition(position);
                if (holder instanceof VideoAdapter.VideoViewHolder) {
                    VideoAdapter.VideoViewHolder vh = (VideoAdapter.VideoViewHolder) holder;
                    
                    if (exoPlayer != null) {
                        exoPlayer.release();
                    }
                    
                    exoPlayer = new androidx.media3.exoplayer.ExoPlayer.Builder(CreatorFeedActivity.this).build();
                    exoPlayer.setRepeatMode(Player.REPEAT_MODE_ONE);
                    
                    androidx.media3.common.MediaItem mediaItem = androidx.media3.common.MediaItem.fromUri(android.net.Uri.parse(finalHlsUrl));
                    
                    // Use caching MediaSource for faster loads
                    androidx.media3.exoplayer.source.MediaSource mediaSource = 
                        new androidx.media3.exoplayer.hls.HlsMediaSource.Factory(VideoPreloader.getCacheDataSourceFactory())
                            .createMediaSource(mediaItem);
                    
                    exoPlayer.setMediaSource(mediaSource);
                    
                    exoPlayer.addListener(new Player.Listener() {
                        @Override
                        public void onPlaybackStateChanged(int playbackState) {
                            if (playbackState == Player.STATE_READY) {
                                vh.progressBar.setVisibility(View.GONE);
                            } else if (playbackState == Player.STATE_BUFFERING) {
                                vh.progressBar.setVisibility(View.VISIBLE);
                            }
                        }
                    });

                    vh.playerView.setPlayer(exoPlayer);
                    exoPlayer.prepare();
                    exoPlayer.play();
                }
            });
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (exoPlayer != null) exoPlayer.play();
        if (videoAdapter != null) videoAdapter.syncFollowStateWithManager();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (exoPlayer != null) exoPlayer.pause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (exoPlayer != null) {
            exoPlayer.release();
            exoPlayer = null;
        }
    }
}
