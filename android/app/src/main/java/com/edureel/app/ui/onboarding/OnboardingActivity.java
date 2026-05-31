package com.edureel.app.ui.onboarding;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;

import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.UserProfile;
import com.edureel.app.ui.feed.HomeActivity;
import com.edureel.app.utils.TokenManager;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class OnboardingActivity extends AppCompatActivity {

    private ViewPager2 viewPager;
    private ProgressBar progressBar;
    private TextView tvStep;
    
    // Shared Data
    public String selectedAgeGroup = "";
    public int selectedClassLevel = -1;
    public List<String> selectedSubjects = new ArrayList<>();
    
    // DB Metadata
    public com.edureel.app.models.Metadata appMetadata = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_onboarding);

        viewPager = findViewById(R.id.viewPager);
        progressBar = findViewById(R.id.progressBar);
        tvStep = findViewById(R.id.tvStep);

        viewPager.setUserInputEnabled(false); // Disable swipe
        viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                int step = position + 1;
                progressBar.setProgress(step);
                tvStep.setText("Step " + step + " of 3");
            }
        });

        loadExistingProfile();
    }

    private void loadExistingProfile() {
        ApiService apiService = ApiClient.getClient(new TokenManager(this)).create(ApiService.class);
        
        // Fetch Metadata first
        apiService.getMetadata().enqueue(new Callback<ApiResponse<com.edureel.app.models.Metadata>>() {
            @Override
            public void onResponse(Call<ApiResponse<com.edureel.app.models.Metadata>> call, Response<ApiResponse<com.edureel.app.models.Metadata>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    appMetadata = response.body().getData();
                }
                fetchProfileAndSetAdapter(apiService);
            }

            @Override
            public void onFailure(Call<ApiResponse<com.edureel.app.models.Metadata>> call, Throwable t) {
                fetchProfileAndSetAdapter(apiService);
            }
        });
    }

    private void fetchProfileAndSetAdapter(ApiService apiService) {
        apiService.getProfile().enqueue(new Callback<ApiResponse<UserProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<UserProfile>> call, Response<ApiResponse<UserProfile>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    UserProfile profile = response.body().getData();
                    if (profile.getAgeGroup() != null) selectedAgeGroup = profile.getAgeGroup();
                    
                    if (profile.getClassLevel() != null) {
                        selectedClassLevel = profile.getClassLevel();
                    }
                    
                    if (profile.getSubjects() != null) selectedSubjects = profile.getSubjects();
                }
                // Set adapter after loading data
                viewPager.setAdapter(new OnboardingPagerAdapter(OnboardingActivity.this));
            }

            @Override
            public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {
                viewPager.setAdapter(new OnboardingPagerAdapter(OnboardingActivity.this));
            }
        });
    }

    public void nextPage() {
        if (viewPager.getCurrentItem() < 2) {
            viewPager.setCurrentItem(viewPager.getCurrentItem() + 1);
        } else {
            submitOnboarding();
        }
    }

    private void submitOnboarding() {
        if (selectedAgeGroup.isEmpty() || selectedClassLevel == -1 || selectedSubjects.isEmpty()) {
            Toast.makeText(this, "Please complete all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, Object> body = new HashMap<>();
        body.put("ageGroup", selectedAgeGroup);
        body.put("classLevel", selectedClassLevel);
        body.put("subjects", selectedSubjects);

        ApiService apiService = ApiClient.getClient(new TokenManager(this)).create(ApiService.class);
        apiService.updateOnboarding(body).enqueue(new Callback<ApiResponse<UserProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<UserProfile>> call, Response<ApiResponse<UserProfile>> response) {
                if (response.isSuccessful()) {
                    startActivity(new Intent(OnboardingActivity.this, HomeActivity.class));
                    finish();
                } else {
                    Toast.makeText(OnboardingActivity.this, "Failed to update profile", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {
                Toast.makeText(OnboardingActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private class OnboardingPagerAdapter extends FragmentStateAdapter {
        public OnboardingPagerAdapter(FragmentActivity fa) {
            super(fa);
        }

        @Override
        public Fragment createFragment(int position) {
            switch (position) {
                case 0: return new OnboardingAgeFragment();
                case 1: return new OnboardingClassFragment();
                case 2: return new OnboardingInterestsFragment();
                default: return new OnboardingAgeFragment();
            }
        }

        @Override
        public int getItemCount() {
            return 3;
        }
    }
}
