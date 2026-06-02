package com.edureel.app.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.Metadata;
import com.edureel.app.models.MetadataClass;
import com.edureel.app.models.MetadataSubject;
import com.edureel.app.models.UserProfile;
import com.edureel.app.utils.TokenManager;
import com.google.android.flexbox.FlexboxLayout;

import android.widget.TextView;
import android.graphics.Color;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SettingsContentFragment extends Fragment {

    private Spinner spinnerAge, spinnerClass;
    private FlexboxLayout flexboxSubjects;
    private Button btnSaveContent;
    private ApiService apiService;

    private final String[] ageOptions = {"Under 13", "13-17", "18-22", "23+"};
    
    private List<MetadataClass> classOptionsList = new ArrayList<>();
    private List<MetadataSubject> subjectOptionsList = new ArrayList<>();
    private List<String> selectedSubjects = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_settings_content, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        spinnerAge = view.findViewById(R.id.spinnerAge);
        spinnerClass = view.findViewById(R.id.spinnerClass);
        flexboxSubjects = view.findViewById(R.id.flexboxSubjects);
        btnSaveContent = view.findViewById(R.id.btnSaveContent);

        ArrayAdapter<String> ageAdapter = new ArrayAdapter<>(getContext(), android.R.layout.simple_spinner_dropdown_item, ageOptions);
        spinnerAge.setAdapter(ageAdapter);

        TokenManager tokenManager = new TokenManager(requireContext());
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);

        loadMetadata();

        btnSaveContent.setOnClickListener(v -> saveContent());
    }

    private void loadMetadata() {
        apiService.getMetadata().enqueue(new Callback<ApiResponse<Metadata>>() {
            @Override
            public void onResponse(Call<ApiResponse<Metadata>> call, Response<ApiResponse<Metadata>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Metadata metadata = response.body().getData();
                    if (metadata != null) {
                        classOptionsList = metadata.getClasses();
                        subjectOptionsList = metadata.getSubjects();
                        
                        // Populate Class Spinner
                        List<String> classDisplayOptions = new ArrayList<>();
                        for (MetadataClass mc : classOptionsList) {
                            classDisplayOptions.add(mc.getName());
                        }
                        ArrayAdapter<String> classAdapter = new ArrayAdapter<>(getContext(), android.R.layout.simple_spinner_dropdown_item, classDisplayOptions);
                        spinnerClass.setAdapter(classAdapter);
                        
                        loadCurrentProfile();
                    }
                }
            }
            @Override
            public void onFailure(Call<ApiResponse<Metadata>> call, Throwable t) {
                Toast.makeText(getContext(), "Failed to load metadata", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void populateSubjectsUI() {
        flexboxSubjects.removeAllViews();
        for (MetadataSubject subject : subjectOptionsList) {
            View chipView = getLayoutInflater().inflate(R.layout.item_subject_chip, flexboxSubjects, false);
            TextView tvChip = chipView.findViewById(R.id.tvChip);
            tvChip.setText(subject.getIcon() + " " + subject.getName());
            
            boolean isSelected = selectedSubjects.contains(subject.getName());
            updateChipStyle(tvChip, isSelected);
            
            tvChip.setOnClickListener(v -> {
                if (selectedSubjects.contains(subject.getName())) {
                    selectedSubjects.remove(subject.getName());
                    updateChipStyle(tvChip, false);
                } else {
                    selectedSubjects.add(subject.getName());
                    updateChipStyle(tvChip, true);
                }
            });
            
            flexboxSubjects.addView(chipView);
        }
    }

    private void updateChipStyle(TextView tvChip, boolean isSelected) {
        if (isSelected) {
            tvChip.setBackgroundResource(R.drawable.bg_subject_chip_selected);
            tvChip.setTextColor(Color.WHITE);
        } else {
            tvChip.setBackgroundResource(R.drawable.bg_subject_chip_unselected);
            tvChip.setTextColor(ContextCompat.getColor(getContext(), R.color.colorTextSecondary));
        }
    }

    private void loadCurrentProfile() {
        apiService.getProfile().enqueue(new Callback<ApiResponse<UserProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<UserProfile>> call, Response<ApiResponse<UserProfile>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    UserProfile profile = response.body().getData();
                    if (profile != null) {
                        if (profile.getAgeGroup() != null) {
                            for (int i = 0; i < ageOptions.length; i++) {
                                if (ageOptions[i].equals(profile.getAgeGroup())) {
                                    spinnerAge.setSelection(i);
                                    break;
                                }
                            }
                        }

                        if (profile.getClassLevel() != null) {
                            for (int i = 0; i < classOptionsList.size(); i++) {
                                if (classOptionsList.get(i).getValue() == profile.getClassLevel()) {
                                    spinnerClass.setSelection(i);
                                    break;
                                }
                            }
                        }

                        if (profile.getSubjects() != null) {
                            selectedSubjects = new ArrayList<>(profile.getSubjects());
                        }
                        
                        populateSubjectsUI();
                    }
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {}
        });
    }

    private void saveContent() {
        String ageGroup = ageOptions[spinnerAge.getSelectedItemPosition()];
        
        int classLevel = 9; // fallback
        if (!classOptionsList.isEmpty() && spinnerClass.getSelectedItemPosition() >= 0) {
            classLevel = classOptionsList.get(spinnerClass.getSelectedItemPosition()).getValue();
        }

        Map<String, Object> body = new HashMap<>();
        body.put("ageGroup", ageGroup);
        body.put("classLevel", classLevel);
        body.put("subjects", selectedSubjects);

        btnSaveContent.setEnabled(false);
        btnSaveContent.setText("Saving...");

        apiService.updateProfile(body).enqueue(new Callback<ApiResponse<UserProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<UserProfile>> call, Response<ApiResponse<UserProfile>> response) {
                btnSaveContent.setEnabled(true);
                btnSaveContent.setText("Save Content Preferences");
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "Content preferences updated!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(getContext(), "Failed to update preferences", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {
                btnSaveContent.setEnabled(true);
                btnSaveContent.setText("Save Content Preferences");
                Toast.makeText(getContext(), "Network Error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
