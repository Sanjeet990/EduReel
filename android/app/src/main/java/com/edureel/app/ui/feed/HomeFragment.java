package com.edureel.app.ui.feed;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
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

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeFragment extends Fragment {

    private ViewPager2 viewPager;
    private VideoAdapter videoAdapter;
    private ExoPlayer exoPlayer;
    private TokenManager tokenManager;
    private int currentPage = 1;
    private boolean isLoading = false;
    private boolean hasMorePages = true;
    private ApiService apiService;
    private int currentPlayingIndex = -1;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_home, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        tokenManager = new TokenManager(requireContext());
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);
        
        viewPager = view.findViewById(R.id.viewPager);
        videoAdapter = new VideoAdapter();
        videoAdapter.setOnVideoInteractionListener(new VideoAdapter.OnVideoInteractionListener() {
            @Override
            public void onLike(Video video, ImageView btnLike, TextView tvLikeCount) {
                apiService.likeVideo(video.getId()).enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
                    @Override
                    public void onResponse(Call<ApiResponse<Map<String, Object>>> call, Response<ApiResponse<Map<String, Object>>> response) {
                        if (response.isSuccessful()) {
                            btnLike.setColorFilter(android.graphics.Color.RED);
                            Toast.makeText(getContext(), "Liked!", Toast.LENGTH_SHORT).show();
                        }
                    }
                    @Override
                    public void onFailure(Call<ApiResponse<Map<String, Object>>> call, Throwable t) {}
                });
            }

            @Override
            public void onComment(Video video) {
                CommentBottomSheetFragment bottomSheet = new CommentBottomSheetFragment(video.getId());
                bottomSheet.show(getChildFragmentManager(), "CommentBottomSheet");
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
                        if (response.isSuccessful()) {
                            btnSave.setColorFilter(android.graphics.Color.YELLOW);
                            Toast.makeText(getContext(), "Saved!", Toast.LENGTH_SHORT).show();
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
                            
                            if (actualStatus) {
                                Toast.makeText(getContext(), "Followed!", Toast.LENGTH_SHORT).show();
                            } else {
                                Toast.makeText(getContext(), "Unfollowed", Toast.LENGTH_SHORT).show();
                            }
                        }
                    }
                    @Override
                    public void onFailure(Call<ApiResponse<Map<String, Boolean>>> call, Throwable t) {
                        if (videoAdapter != null) {
                            videoAdapter.updateFollowStatus(uploaderId, !newStatus);
                        }
                        Toast.makeText(getContext(), "Network error", Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onProfileClick(String userId) {
                if (userId != null) {
                    Intent profileIntent = new Intent(getContext(), PublicProfileActivity.class);
                    profileIntent.putExtra(PublicProfileActivity.EXTRA_USER_ID, userId);
                    startActivity(profileIntent);
                }
            }
        });
        viewPager.setAdapter(videoAdapter);

        exoPlayer = new ExoPlayer.Builder(requireContext()).build();
        exoPlayer.setRepeatMode(Player.REPEAT_MODE_ONE);

        setupViewPager();
        loadVideos();
    }

    private void setupViewPager() {
        viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                super.onPageSelected(position);
                playVideoAtPosition(position);
                
                // Prefetch surrounding videos (5 before, 5 after)
                if (videoAdapter != null && videoAdapter.getItemCount() > 0) {
                    VideoPreloader.prefetchSurroundingVideos(requireContext(), videoAdapter.getVideos(), position);
                }

                if (position >= videoAdapter.getItemCount() - 3 && !isLoading && hasMorePages) {
                    currentPage++;
                    loadVideos();
                }
            }
        });
    }

    private void loadVideos() {
        isLoading = true;
        ApiService apiService = ApiClient.getClient(tokenManager).create(ApiService.class);
        apiService.getFeed(currentPage, 10).enqueue(new Callback<ApiResponse<List<Video>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Video>>> call, Response<ApiResponse<List<Video>>> response) {
                isLoading = false;
                if (response.isSuccessful() && response.body() != null) {
                    List<Video> videos = response.body().getData();
                    if (videos == null || videos.isEmpty()) {
                        hasMorePages = false;
                        return;
                    }
                    if (currentPage == 1) {
                        videoAdapter.setVideos(videos);
                    } else {
                        videoAdapter.addVideos(videos);
                    }
                } else if (response.code() == 402) {
                    Toast.makeText(getContext(), "Subscription required!", Toast.LENGTH_SHORT).show();
                    startActivity(new android.content.Intent(getActivity(), com.edureel.app.ui.paywall.PaywallActivity.class));
                } else {
                    Toast.makeText(getContext(), "Failed to load feed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Video>>> call, Throwable t) {
                isLoading = false;
                Toast.makeText(getContext(), "Network Error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void playVideoAtPosition(int position) {
        if (currentPlayingIndex == position) return;

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
                
                exoPlayer = new androidx.media3.exoplayer.ExoPlayer.Builder(requireContext()).build();
                exoPlayer.setRepeatMode(androidx.media3.common.Player.REPEAT_MODE_ONE);

                String hlsUrl = video.getHlsUrl();
                if (hlsUrl.startsWith("/hls")) {
                    hlsUrl = "http://192.168.29.15:5000" + hlsUrl;
                }

                androidx.media3.common.MediaItem mediaItem = androidx.media3.common.MediaItem.fromUri(android.net.Uri.parse(hlsUrl));
                
                // Use the caching MediaSource
                androidx.media3.exoplayer.source.MediaSource mediaSource = 
                    new androidx.media3.exoplayer.hls.HlsMediaSource.Factory(VideoPreloader.getCacheDataSourceFactory())
                        .createMediaSource(mediaItem);
                
                exoPlayer.setMediaSource(mediaSource);

                holder.playerView.setPlayer(exoPlayer);
                
                exoPlayer.addListener(new Player.Listener() {
                    @Override
                    public void onPlaybackStateChanged(int playbackState) {
                        if (playbackState == Player.STATE_READY) {
                            holder.progressBar.setVisibility(View.GONE);
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
        if (exoPlayer != null) {
            exoPlayer.release();
            exoPlayer = null;
        }
    }
}
