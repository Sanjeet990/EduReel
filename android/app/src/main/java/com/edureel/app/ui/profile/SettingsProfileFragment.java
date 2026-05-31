package com.edureel.app.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.UserProfile;
import com.edureel.app.utils.TokenManager;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SettingsProfileFragment extends Fragment {

    private EditText etName, etPassword;
    private Button btnSaveProfile;
    private ApiService apiService;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_settings_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        etName = view.findViewById(R.id.etName);
        etPassword = view.findViewById(R.id.etPassword);
        btnSaveProfile = view.findViewById(R.id.btnSaveProfile);

        TokenManager tokenManager = new TokenManager(requireContext());
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);

        loadCurrentProfile();

        btnSaveProfile.setOnClickListener(v -> saveProfile());
    }

    private void loadCurrentProfile() {
        apiService.getProfile().enqueue(new Callback<ApiResponse<UserProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<UserProfile>> call, Response<ApiResponse<UserProfile>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    UserProfile profile = response.body().getData();
                    if (profile != null && profile.getUser() != null && profile.getUser().containsKey("name")) {
                        etName.setText(profile.getUser().get("name"));
                    }
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {}
        });
    }

    private void saveProfile() {
        String name = etName.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        Map<String, Object> body = new HashMap<>();
        if (!name.isEmpty()) body.put("name", name);
        if (!password.isEmpty()) body.put("password", password);

        if (body.isEmpty()) return;

        btnSaveProfile.setEnabled(false);
        btnSaveProfile.setText("Saving...");

        apiService.updateProfile(body).enqueue(new Callback<ApiResponse<UserProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<UserProfile>> call, Response<ApiResponse<UserProfile>> response) {
                btnSaveProfile.setEnabled(true);
                btnSaveProfile.setText("Save Profile");
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "Profile updated successfully!", Toast.LENGTH_SHORT).show();
                    etPassword.setText("");
                } else {
                    Toast.makeText(getContext(), "Failed to update profile", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {
                btnSaveProfile.setEnabled(true);
                btnSaveProfile.setText("Save Profile");
                Toast.makeText(getContext(), "Network Error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
