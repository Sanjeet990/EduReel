package com.edureel.app.ui.profile;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.databinding.ActivityPlanListingBinding;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.Plan;
import com.edureel.app.utils.TokenManager;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PlanListingActivity extends AppCompatActivity {
    private ActivityPlanListingBinding binding;
    private ApiService apiService;
    private PlanAdapter adapter;

    private String userName = "User";
    private String userEmail = "test@example.com";
    private boolean isTrialActive = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityPlanListingBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        TokenManager tokenManager = new TokenManager(this);
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);

        binding.btnBack.setOnClickListener(v -> finish());
        binding.rvPlans.setLayoutManager(new LinearLayoutManager(this));

        fetchPlans();
    }

    @Override
    protected void onResume() {
        super.onResume();
        fetchUserDetails();
    }
    
    private void fetchUserDetails() {
        apiService.getMe().enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, Object>>> call, Response<ApiResponse<Map<String, Object>>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    Map<String, Object> data = response.body().getData();
                    if (data.containsKey("user")) {
                        Map<String, Object> user = (Map<String, Object>) data.get("user");
                        if (user != null) {
                            if (user.containsKey("name")) userName = (String) user.get("name");
                            if (user.containsKey("email")) userEmail = (String) user.get("email");
                            if (user.containsKey("trialActive") && user.get("trialActive") instanceof Boolean) {
                                isTrialActive = (Boolean) user.get("trialActive");
                            }
                            
                            if (isTrialActive) {
                                binding.tvCurrentPlanName.setText("Free Trial");
                                binding.tvCurrentPlanExpiry.setText("Expires soon");
                            } else {
                                binding.tvCurrentPlanName.setText("Monthly Plan Active");
                                binding.tvCurrentPlanExpiry.setText("");
                            }
                        }
                    }
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Map<String, Object>>> call, Throwable t) {
                // Ignore failure for UI
            }
        });
    }

    private void fetchPlans() {
        binding.progressBar.setVisibility(View.VISIBLE);
        apiService.getPlans().enqueue(new Callback<ApiResponse<List<Plan>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Plan>>> call, Response<ApiResponse<List<Plan>>> response) {
                binding.progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    List<Plan> plans = response.body().getData();
                    adapter = new PlanAdapter(plans, plan -> initiatePayment(plan));
                    binding.rvPlans.setAdapter(adapter);
                } else {
                    Toast.makeText(PlanListingActivity.this, "Failed to load plans", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Plan>>> call, Throwable t) {
                binding.progressBar.setVisibility(View.GONE);
                Toast.makeText(PlanListingActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void initiatePayment(Plan plan) {
        // PayU recommends amount formatted to 2 decimal places
        String amountStr = String.format(java.util.Locale.US, "%.2f", plan.getPrice());

        Map<String, Object> body = new HashMap<>();
        body.put("amount", amountStr);
        body.put("productinfo", plan.getName());
        body.put("firstname", userName);
        body.put("email", userEmail);
        body.put("phone", "9999999999");
        body.put("planId", plan.getId());

        binding.progressBar.setVisibility(View.VISIBLE);
        apiService.createOrder(body).enqueue(new Callback<ApiResponse<Map<String, String>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, String>>> call, Response<ApiResponse<Map<String, String>>> response) {
                binding.progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    Map<String, String> data = response.body().getData();
                    openPayUGateway(data, plan, amountStr);
                } else {
                    String errMsg = "Failed to create order";
                    if (response.errorBody() != null) {
                        try {
                            errMsg += ": " + response.errorBody().string();
                        } catch (Exception e) {}
                    } else if (response.body() != null && response.body().getMessage() != null) {
                        errMsg += ": " + response.body().getMessage();
                    }
                    Toast.makeText(PlanListingActivity.this, errMsg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Map<String, String>>> call, Throwable t) {
                binding.progressBar.setVisibility(View.GONE);
                Toast.makeText(PlanListingActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void openPayUGateway(Map<String, String> data, Plan plan, String amountStr) {
        Intent intent = new Intent(this, PayUWebViewActivity.class);
        intent.putExtra("txnid", data.get("txnid"));
        intent.putExtra("hash", data.get("hash"));
        intent.putExtra("key", data.get("key"));
        intent.putExtra("udf1", data.get("udf1"));
        intent.putExtra("udf2", data.get("udf2"));
        intent.putExtra("amount", amountStr);
        intent.putExtra("productinfo", plan.getName());
        intent.putExtra("firstname", userName);
        intent.putExtra("email", userEmail);
        intent.putExtra("phone", "9999999999");
        intent.putExtra("surl", "https://reels.sanjeetpathak.in/api/payments/payu-callback"); // Success URL
        intent.putExtra("furl", "https://reels.sanjeetpathak.in/api/payments/payu-callback"); // Failure URL
        startActivity(intent);
    }
}
