package com.edureel.app.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.UserProfile;
import com.edureel.app.utils.TokenManager;

import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class FollowingFragment extends Fragment {

    private RecyclerView recyclerView;
    private View emptyView;
    private FollowListAdapter adapter;
    private ApiService apiService;
    private String userId;

    private int currentPage = 1;
    private final int limit = 20;
    private boolean isLoading = false;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_following, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        recyclerView = view.findViewById(R.id.recyclerView);
        emptyView = view.findViewById(R.id.emptyView);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new FollowListAdapter();
        recyclerView.setAdapter(adapter);

        TokenManager tokenManager = new TokenManager(requireContext());
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);

        adapter.setOnLoadMoreListener(() -> {
            if (!isLoading) {
                currentPage++;
                loadUsers(true);
            }
        });

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
                if (getContext() != null) {
                    Toast.makeText(getContext(), "Failed to load user ID", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {
                isLoading = false;
                if (getContext() != null) {
                    Toast.makeText(getContext(), "Network error", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    private void loadUsers(boolean isLoadMore) {
        isLoading = true;
        
        Call<ApiResponse<List<Map<String, String>>>> call = apiService.getFollowing(userId, currentPage, limit);

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
                    
                    if (adapter.getItemCount() == 0) {
                        emptyView.setVisibility(View.VISIBLE);
                        recyclerView.setVisibility(View.GONE);
                    } else {
                        emptyView.setVisibility(View.GONE);
                        recyclerView.setVisibility(View.VISIBLE);
                    }
                } else {
                    if (getContext() != null) {
                        Toast.makeText(getContext(), "Failed to load list", Toast.LENGTH_SHORT).show();
                    }
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Map<String, String>>>> call, Throwable t) {
                isLoading = false;
                if (getContext() != null) {
                    Toast.makeText(getContext(), "Network error", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }
}
