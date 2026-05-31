package com.edureel.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.appcompat.app.AppCompatActivity;

import com.edureel.app.R;
import com.edureel.app.ui.feed.HomeActivity;
import com.edureel.app.utils.TokenManager;

public class SplashActivity extends AppCompatActivity {
    private TokenManager tokenManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        tokenManager = new TokenManager(this);

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            String token = tokenManager.getToken();

            if (token != null && !token.isEmpty()) {
                fetchProfileAndRoute();
            } else {
                startActivity(new Intent(this, LoginActivity.class));
                finish();
            }
        }, 2000); // 2-second delay
    }

    private void fetchProfileAndRoute() {
        com.edureel.app.api.ApiService apiService = com.edureel.app.api.ApiClient.getClient(tokenManager).create(com.edureel.app.api.ApiService.class);
        apiService.getMe().enqueue(new retrofit2.Callback<com.edureel.app.models.ApiResponse<java.util.Map<String, Object>>>() {
            @Override
            public void onResponse(retrofit2.Call<com.edureel.app.models.ApiResponse<java.util.Map<String, Object>>> call, retrofit2.Response<com.edureel.app.models.ApiResponse<java.util.Map<String, Object>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    java.util.Map<String, Object> data = response.body().getData();
                    if (data.containsKey("profile") && data.get("profile") != null) {
                        java.util.Map<String, Object> profileMap = (java.util.Map<String, Object>) data.get("profile");
                        if (profileMap.get("classLevel") == null) {
                            startActivity(new Intent(SplashActivity.this, com.edureel.app.ui.onboarding.OnboardingActivity.class));
                            finish();
                            return;
                        }
                    } else {
                        // Profile is null, force onboarding
                        startActivity(new Intent(SplashActivity.this, com.edureel.app.ui.onboarding.OnboardingActivity.class));
                        finish();
                        return;
                    }
                }
                startActivity(new Intent(SplashActivity.this, HomeActivity.class));
                finish();
            }

            @Override
            public void onFailure(retrofit2.Call<com.edureel.app.models.ApiResponse<java.util.Map<String, Object>>> call, Throwable t) {
                startActivity(new Intent(SplashActivity.this, HomeActivity.class));
                finish();
            }
        });
    }
}
