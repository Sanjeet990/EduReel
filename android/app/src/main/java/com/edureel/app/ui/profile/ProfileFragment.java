package com.edureel.app.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.UserProfile;
import com.edureel.app.models.Video;
import com.edureel.app.utils.TokenManager;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;
import com.yalantis.ucrop.UCrop;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.List;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileFragment extends Fragment {

    private TextView tvAvatar, tvUsername, tvClassInfo;
    private android.widget.ImageView ivAvatar;
    private TextView tvWatchedCount, tvFollowersCount, tvFollowingCount, tvSavedReelsHeader;
    private RecyclerView rvSavedReels;
    private SavedReelsAdapter adapter;
    private ApiService apiService;
    private ActivityResultLauncher<androidx.activity.result.PickVisualMediaRequest> pickMedia;
    private ActivityResultLauncher<android.content.Intent> cropResultLauncher;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        pickMedia = registerForActivityResult(new ActivityResultContracts.PickVisualMedia(), uri -> {
            if (uri != null) {
                startCrop(uri);
            }
        });

        cropResultLauncher = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
            if (result.getResultCode() == android.app.Activity.RESULT_OK && result.getData() != null) {
                android.net.Uri resultUri = UCrop.getOutput(result.getData());
                if (resultUri != null) {
                    uploadAvatarImage(resultUri);
                }
            } else if (result.getResultCode() == UCrop.RESULT_ERROR) {
                Throwable cropError = UCrop.getError(result.getData());
                Toast.makeText(getContext(), "Crop error: " + (cropError != null ? cropError.getMessage() : "Unknown"), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        TokenManager tokenManager = new TokenManager(requireContext());
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);

        tvAvatar = view.findViewById(R.id.tvAvatar);
        ivAvatar = view.findViewById(R.id.ivAvatar);
        tvUsername = view.findViewById(R.id.tvUsername);
        tvClassInfo = view.findViewById(R.id.tvClassInfo);
        tvWatchedCount = view.findViewById(R.id.tvWatchedCount);
        tvFollowersCount = view.findViewById(R.id.tvFollowersCount);
        tvFollowingCount = view.findViewById(R.id.tvFollowingCount);
        tvSavedReelsHeader = view.findViewById(R.id.tvSavedReelsHeader);
        
        View cardWatched = view.findViewById(R.id.cardWatched);
        View cardFollowers = view.findViewById(R.id.cardFollowers);
        View cardFollowing = view.findViewById(R.id.cardFollowing);
        View avatarContainer = view.findViewById(R.id.avatarContainer);
        android.widget.ImageView btnSettings = view.findViewById(R.id.btnSettings);

        btnSettings.setOnClickListener(v -> {
            startActivity(new android.content.Intent(getContext(), SettingsActivity.class));
        });

        avatarContainer.setOnClickListener(v -> {
            pickMedia.launch(new androidx.activity.result.PickVisualMediaRequest.Builder()
                    .setMediaType(ActivityResultContracts.PickVisualMedia.ImageOnly.INSTANCE)
                    .build());
        });

        rvSavedReels = view.findViewById(R.id.rvSavedReels);
        rvSavedReels.setLayoutManager(new GridLayoutManager(getContext(), 3));
        adapter = new SavedReelsAdapter();
        rvSavedReels.setAdapter(adapter);

        cardWatched.setOnClickListener(v -> {
            startActivity(new android.content.Intent(getContext(), com.edureel.app.ui.feed.WatchedFeedActivity.class));
        });

        cardFollowers.setOnClickListener(v -> {
            android.content.Intent intent = new android.content.Intent(getContext(), FollowListActivity.class);
            intent.putExtra("TYPE", "FOLLOWERS");
            startActivity(intent);
        });

        cardFollowing.setOnClickListener(v -> {
            android.content.Intent intent = new android.content.Intent(getContext(), FollowListActivity.class);
            intent.putExtra("TYPE", "FOLLOWING");
            startActivity(intent);
        });

        loadProfileData();
        loadSavedVideos();
    }

    private void loadProfileData() {
        apiService.getProfile().enqueue(new Callback<ApiResponse<UserProfile>>() {
            @Override
            public void onResponse(Call<ApiResponse<UserProfile>> call, Response<ApiResponse<UserProfile>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    UserProfile profile = response.body().getData();
                    if (profile != null) {
                        String name = "User";
                        if (profile.getUser() != null && profile.getUser().containsKey("name")) {
                            name = profile.getUser().get("name");
                        }
                        
                        tvUsername.setText(name);
                        tvAvatar.setText(name.substring(0, 1).toUpperCase());
                        tvClassInfo.setText((profile.getClassLevel() != null ? "Class: " + profile.getClassLevel() : "General") + " • " + (profile.getAgeGroup() != null ? "Age: " + profile.getAgeGroup() : "No age set"));

                        if (profile.getProfileImage() != null) {
                            ivAvatar.setVisibility(View.VISIBLE);
                            String imageUrl = profile.getProfileImage();
                            if (imageUrl.startsWith("/")) {
                                imageUrl = com.edureel.app.utils.Constants.SERVER_URL + imageUrl;
                            }
                            Glide.with(ProfileFragment.this)
                                    .load(imageUrl)
                                    .apply(RequestOptions.circleCropTransform())
                                    .into(ivAvatar);
                        }

                        int followersCount = profile.getFollowers() != null ? profile.getFollowers().size() : 0;
                        int followingCount = profile.getFollowing() != null ? profile.getFollowing().size() : 0;
                        tvFollowersCount.setText(String.valueOf(followersCount));
                        tvFollowingCount.setText(String.valueOf(followingCount));
                    }
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {
                Toast.makeText(getContext(), "Failed to load profile", Toast.LENGTH_SHORT).show();
            }
        });

        // Load today's watched history count
        apiService.getHistory().enqueue(new Callback<ApiResponse<List<Video>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Video>>> call, Response<ApiResponse<List<Video>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Video> videos = response.body().getData();
                    tvWatchedCount.setText(String.valueOf(videos.size()));
                }
            }
            @Override
            public void onFailure(Call<ApiResponse<List<Video>>> call, Throwable t) {}
        });
    }

    private void loadSavedVideos() {
        apiService.getSavedVideos().enqueue(new Callback<ApiResponse<List<Video>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Video>>> call, Response<ApiResponse<List<Video>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Video> videos = response.body().getData();
                    tvSavedReelsHeader.setText("Saved Reels (" + videos.size() + ")");
                    adapter.setVideos(videos);
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Video>>> call, Throwable t) {
                Toast.makeText(getContext(), "Failed to load saved reels", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void startCrop(android.net.Uri sourceUri) {
        File destFile = new File(requireContext().getCacheDir(), "cropped_avatar_" + System.currentTimeMillis() + ".jpg");
        android.net.Uri destUri = android.net.Uri.fromFile(destFile);

        UCrop.Options options = new UCrop.Options();
        options.setCircleDimmedLayer(true);
        options.setShowCropGrid(false);
        options.setToolbarColor(android.graphics.Color.parseColor("#0D0E15"));
        options.setStatusBarColor(android.graphics.Color.parseColor("#0D0E15"));
        options.setToolbarWidgetColor(android.graphics.Color.WHITE);
        options.setHideBottomControls(true);

        android.content.Intent uCropIntent = UCrop.of(sourceUri, destUri)
                .withAspectRatio(1, 1)
                .withMaxResultSize(500, 500)
                .withOptions(options)
                .getIntent(requireContext());

        cropResultLauncher.launch(uCropIntent);
    }

    private void uploadAvatarImage(android.net.Uri uri) {
        try {
            InputStream is = requireContext().getContentResolver().openInputStream(uri);
            File tempFile = new File(requireContext().getCacheDir(), "avatar.jpg");
            FileOutputStream fos = new FileOutputStream(tempFile);
            byte[] buf = new byte[1024];
            int len;
            while ((len = is.read(buf)) > 0) {
                fos.write(buf, 0, len);
            }
            fos.close();
            is.close();

            RequestBody requestFile = RequestBody.create(MediaType.parse("image/jpeg"), tempFile);
            MultipartBody.Part body = MultipartBody.Part.createFormData("avatar", tempFile.getName(), requestFile);

            apiService.uploadAvatar(body).enqueue(new Callback<ApiResponse<UserProfile>>() {
                @Override
                public void onResponse(Call<ApiResponse<UserProfile>> call, Response<ApiResponse<UserProfile>> response) {
                    if (response.isSuccessful() && response.body() != null) {
                        Toast.makeText(getContext(), "Avatar updated!", Toast.LENGTH_SHORT).show();
                        loadProfileData(); // Reload to show new image
                    } else {
                        Toast.makeText(getContext(), "Failed to upload avatar", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiResponse<UserProfile>> call, Throwable t) {
                    Toast.makeText(getContext(), "Upload error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(getContext(), "Error processing image", Toast.LENGTH_SHORT).show();
        }
    }
}
