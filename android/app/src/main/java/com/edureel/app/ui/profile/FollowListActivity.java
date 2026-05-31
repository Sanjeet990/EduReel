package com.edureel.app.ui.profile;

import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.UserProfile;
import com.edureel.app.utils.TokenManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class FollowListActivity extends AppCompatActivity {

    private String type; // "FOLLOWERS" or "FOLLOWING"
    private RecyclerView recyclerView;
    private FollowListAdapter adapter;
    private ApiService apiService;
    private String userId;

    private int currentPage = 1;
    private final int limit = 20;
    private boolean isLoading = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_follow_list);

        type = getIntent().getStringExtra("TYPE");
        if (type == null) type = "FOLLOWERS";

        TextView tvTitle = findViewById(R.id.tvTitle);
        tvTitle.setText(type.equals("FOLLOWERS") ? "Followers" : "Following");

        ImageView btnBack = findViewById(R.id.btnBack);
        btnBack.setOnClickListener(v -> finish());

        recyclerView = findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new FollowListAdapter();
        recyclerView.setAdapter(adapter);

        TokenManager tokenManager = new TokenManager(this);
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);

        adapter.setOnLoadMoreListener(() -> {
            if (!isLoading) {
                currentPage++;
                loadUsers(true);
            }
        });

        // First, get the current user's profile to get their ID, or use "me" if supported
        // But the API requires a specific user ID. Let's fetch profile first.
        fetchProfileAndLoadUsers();
    }

    private void fetchProfileAndLoadUsers() {
        isLoading = true;
        apiService.getProfile().enqueue(new Callback<ApiResponse<UserProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<UserProfile>> call, Response<ApiResponse<UserProfile>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    UserProfile profile = response.body().getData();
                    if (profile != null) {
                        userId = profile.getUserId();
                        loadUsers(false);
                        return;
                    }
                }
                isLoading = false;
                Toast.makeText(FollowListActivity.this, "Failed to load user ID", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {
                isLoading = false;
                Toast.makeText(FollowListActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void loadUsers(boolean isLoadMore) {
        isLoading = true;
        Call<ApiResponse<List<Map<String, String>>>> call;
        
        if (type.equals("FOLLOWERS")) {
            call = apiService.getFollowers(userId, currentPage, limit);
        } else {
            call = apiService.getFollowing(userId, currentPage, limit);
        }

        call.enqueue(new Callback<ApiResponse<List<Map<String, String>>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Map<String, String>>>> call, Response<ApiResponse<List<Map<String, String>>>> response) {
                isLoading = false;
                if (response.isSuccessful() && response.body() != null) {
                    List<Map<String, String>> users = response.body().getData();
                    boolean hasMore = response.body().hasMore();

                    if (isLoadMore) {
                        adapter.addUsers(users, hasMore);
                    } else {
                        adapter.setUsers(users, hasMore);
                    }
                } else {
                    Toast.makeText(FollowListActivity.this, "Failed to load list", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Map<String, String>>>> call, Throwable t) {
                isLoading = false;
                Toast.makeText(FollowListActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
