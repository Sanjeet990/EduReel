package com.edureel.app.ui.explore;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.Metadata;
import com.edureel.app.models.Video;
import com.edureel.app.utils.TokenManager;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ExploreFragment extends Fragment {
    private RecyclerView rvSubjects;
    private RecyclerView rvTrending;
    private ProgressBar progressBar;
    private ExploreAdapter trendingAdapter;
    private SubjectAdapter subjectAdapter;
    private ApiService apiService;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_explore, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        rvSubjects = view.findViewById(R.id.rvSubjects);
        rvTrending = view.findViewById(R.id.rvTrending);
        progressBar = view.findViewById(R.id.progressBar);

        // 2x2 grid for subjects
        rvSubjects.setLayoutManager(new GridLayoutManager(getContext(), 2));
        subjectAdapter = new SubjectAdapter();
        rvSubjects.setAdapter(subjectAdapter);

        // Vertical list for trending
        rvTrending.setLayoutManager(new LinearLayoutManager(getContext()));
        trendingAdapter = new ExploreAdapter();
        rvTrending.setAdapter(trendingAdapter);

        apiService = ApiClient.getClient(new TokenManager(requireContext())).create(ApiService.class);

        loadSubjects();
        loadTrendingVideos();
    }

    private void loadSubjects() {
        apiService.getMetadata().enqueue(new Callback<ApiResponse<Metadata>>() {
            @Override
            public void onResponse(Call<ApiResponse<Metadata>> call, Response<ApiResponse<Metadata>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Metadata metadata = response.body().getData();
                    if (metadata != null && metadata.getSubjects() != null) {
                        subjectAdapter.setSubjects(metadata.getSubjects());
                    }
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Metadata>> call, Throwable t) {
                // Handle failure silently for subjects or show a toast
            }
        });
    }

    private void loadTrendingVideos() {
        progressBar.setVisibility(View.VISIBLE);
        apiService.getExplore(null, null).enqueue(new Callback<ApiResponse<List<Video>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Video>>> call, Response<ApiResponse<List<Video>>> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    trendingAdapter.setVideos(response.body().getData());
                } else {
                    Toast.makeText(getContext(), "Failed to load explore", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Video>>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                Toast.makeText(getContext(), "Network Error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
