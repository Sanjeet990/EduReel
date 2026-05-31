package com.edureel.app.ui.feed;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

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

public class PublicProfileActivity extends AppCompatActivity {

    public static final String EXTRA_USER_ID = "extra_user_id";

    private String targetUserId;
    private ApiService apiService;

    private TextView tvToolbarName, tvAvatar, tvVideoCount, tvFollowerCount, tvFollowingCount, tvName;
    private Button btnFollow;
    private TextView tabReels, tabFollowing;
    private RecyclerView rvContent;
    private View emptyView;
    private TextView tvEmptyMessage;
    private ImageView btnBack;

    private VideoGridAdapter videoAdapter;
    private FollowingAdapter followingAdapter;

    private boolean isReelsTab = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_public_profile);

        targetUserId = getIntent().getStringExtra(EXTRA_USER_ID);
        if (targetUserId == null) {
            finish();
            return;
        }

        TokenManager tokenManager = new TokenManager(this);
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);

        initViews();
        setupAdapters();
        loadProfile();
    }

    private void initViews() {
        tvToolbarName = findViewById(R.id.tvToolbarName);
        tvAvatar = findViewById(R.id.tvAvatar);
        tvVideoCount = findViewById(R.id.tvVideoCount);
        tvFollowerCount = findViewById(R.id.tvFollowerCount);
        tvFollowingCount = findViewById(R.id.tvFollowingCount);
        tvName = findViewById(R.id.tvName);
        btnFollow = findViewById(R.id.btnFollow);
        tabReels = findViewById(R.id.tabReels);
        tabFollowing = findViewById(R.id.tabFollowing);
        rvContent = findViewById(R.id.rvContent);
        emptyView = findViewById(R.id.emptyView);
        tvEmptyMessage = findViewById(R.id.tvEmptyMessage);
        btnBack = findViewById(R.id.btnBack);

        btnBack.setOnClickListener(v -> finish());

        tabReels.setOnClickListener(v -> switchTab(true));
        tabFollowing.setOnClickListener(v -> switchTab(false));

        btnFollow.setOnClickListener(v -> toggleFollow());
    }

    private void setupAdapters() {
        videoAdapter = new VideoGridAdapter(video -> {
            Intent intent = new Intent(this, CreatorFeedActivity.class);
            intent.putExtra(CreatorFeedActivity.EXTRA_CREATOR_ID, targetUserId);
            intent.putExtra(CreatorFeedActivity.EXTRA_INITIAL_VIDEO_ID, video.getId());
            startActivity(intent);
        });
        
        followingAdapter = new FollowingAdapter(userId -> {
            Intent intent = new Intent(this, PublicProfileActivity.class);
            intent.putExtra(EXTRA_USER_ID, userId);
            startActivity(intent);
        });

        // Default to Reels
        rvContent.setLayoutManager(new GridLayoutManager(this, 3));
        rvContent.setAdapter(videoAdapter);
    }

    private void switchTab(boolean toReels) {
        if (isReelsTab == toReels) return;
        isReelsTab = toReels;

        if (isReelsTab) {
            tabReels.setTextColor(getResources().getColor(android.R.color.white));
            tabFollowing.setTextColor(0xFF888888);
            rvContent.setLayoutManager(new GridLayoutManager(this, 3));
            rvContent.setAdapter(videoAdapter);
            
            if (videoAdapter.getItemCount() == 0) {
                emptyView.setVisibility(View.VISIBLE);
                tvEmptyMessage.setText("No reels yet");
                rvContent.setVisibility(View.GONE);
            } else {
                emptyView.setVisibility(View.GONE);
                rvContent.setVisibility(View.VISIBLE);
            }
        } else {
            tabReels.setTextColor(0xFF888888);
            tabFollowing.setTextColor(getResources().getColor(android.R.color.white));
            rvContent.setLayoutManager(new LinearLayoutManager(this));
            rvContent.setAdapter(followingAdapter);
            loadFollowing();
        }
    }

    private void loadProfile() {
        apiService.getPublicProfile(targetUserId).enqueue(new Callback<ApiResponse<PublicProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<PublicProfile>> call, Response<ApiResponse<PublicProfile>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    PublicProfile profile = response.body().getData();
                    bindProfile(profile);
                } else {
                    Toast.makeText(PublicProfileActivity.this, "Failed to load profile", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<PublicProfile>> call, Throwable t) {
                Toast.makeText(PublicProfileActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void bindProfile(PublicProfile profile) {
        tvToolbarName.setText(profile.getName());
        tvName.setText(profile.getName());
        tvFollowerCount.setText(String.valueOf(profile.getFollowerCount()));
        tvFollowingCount.setText(String.valueOf(profile.getFollowingCount()));
        
        String initial = profile.getName() != null && !profile.getName().isEmpty() ? profile.getName().substring(0, 1).toUpperCase() : "U";
        tvAvatar.setText(initial);
        
        List<Video> videos = profile.getVideos();
        tvVideoCount.setText(videos != null ? String.valueOf(videos.size()) : "0");
        if (videos != null) {
            videoAdapter.setVideos(videos);
        }
        
        if (isReelsTab) {
            if (videoAdapter.getItemCount() == 0) {
                emptyView.setVisibility(View.VISIBLE);
                tvEmptyMessage.setText("No reels yet");
                rvContent.setVisibility(View.GONE);
            } else {
                emptyView.setVisibility(View.GONE);
                rvContent.setVisibility(View.VISIBLE);
            }
        }

        boolean isFollowing = com.edureel.app.managers.FollowManager.getInstance().isFollowing(targetUserId, profile.isFollowing());
        updateFollowButton(isFollowing);
    }

    private void updateFollowButton(boolean isFollowing) {
        if (isFollowing) {
            btnFollow.setText("Following");
            btnFollow.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF333333)); // Dark grey
        } else {
            btnFollow.setText("Follow");
            btnFollow.setBackgroundTintList(android.content.res.ColorStateList.valueOf(getResources().getColor(R.color.colorAccent)));
        }
    }

    private void toggleFollow() {
        apiService.toggleFollow(targetUserId).enqueue(new Callback<ApiResponse<Map<String, Boolean>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, Boolean>>> call, Response<ApiResponse<Map<String, Boolean>>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    boolean isFollowing = response.body().getData().get("isFollowing");
                    com.edureel.app.managers.FollowManager.getInstance().setFollowing(targetUserId, isFollowing);
                    updateFollowButton(isFollowing);
                    
                    // Increment/decrement local follower count visually
                    int currentCount = Integer.parseInt(tvFollowerCount.getText().toString());
                    tvFollowerCount.setText(String.valueOf(isFollowing ? currentCount + 1 : currentCount - 1));
                }
            }
            @Override
            public void onFailure(Call<ApiResponse<Map<String, Boolean>>> call, Throwable t) {}
        });
    }

    private void loadFollowing() {
        apiService.getFollowing(targetUserId, 1, 20).enqueue(new Callback<ApiResponse<List<Map<String, String>>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Map<String, String>>>> call, Response<ApiResponse<List<Map<String, String>>>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    List<Map<String, String>> users = response.body().getData();
                    followingAdapter.setUsers(users);
                    
                    if (!isReelsTab) {
                        if (users == null || users.isEmpty()) {
                            emptyView.setVisibility(View.VISIBLE);
                            tvEmptyMessage.setText("Not following anyone yet");
                            rvContent.setVisibility(View.GONE);
                        } else {
                            emptyView.setVisibility(View.GONE);
                            rvContent.setVisibility(View.VISIBLE);
                        }
                    }
                }
            }
            @Override
            public void onFailure(Call<ApiResponse<List<Map<String, String>>>> call, Throwable t) {}
        });
    }
}
