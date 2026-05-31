package com.edureel.app.ui.feed;

import android.os.Bundle;
import android.util.Base64;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.edureel.app.R;
import com.edureel.app.api.ApiClient;
import com.edureel.app.api.ApiService;
import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.Comment;
import com.edureel.app.utils.TokenManager;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CommentBottomSheetFragment extends BottomSheetDialogFragment {

    private final String videoId;
    private RecyclerView rvComments;
    private CommentAdapter adapter;
    private ApiService apiService;
    private EditText etComment;
    private ImageView btnSend;
    private TextView tvCommentCount;
    
    private int currentPage = 1;
    private boolean isLoading = false;
    private boolean hasMorePages = true;
    private String currentUserId = "";
    private String parentCommentId = null;

    public CommentBottomSheetFragment(String videoId) {
        this.videoId = videoId;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_comment_bottom_sheet, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        TokenManager tokenManager = new TokenManager(requireContext());
        apiService = ApiClient.getClient(tokenManager).create(ApiService.class);
        currentUserId = decodeUserId(tokenManager.getToken());

        rvComments = view.findViewById(R.id.rvComments);
        etComment = view.findViewById(R.id.etComment);
        btnSend = view.findViewById(R.id.btnSend);
        tvCommentCount = view.findViewById(R.id.tvCommentCount);
        ImageView btnClose = view.findViewById(R.id.btnClose);

        btnClose.setOnClickListener(v -> dismiss());

        LinearLayoutManager layoutManager = new LinearLayoutManager(getContext());
        rvComments.setLayoutManager(layoutManager);
        
        adapter = new CommentAdapter(currentUserId, new CommentAdapter.OnCommentInteractionListener() {
            @Override
            public void onReply(Comment comment) {
                parentCommentId = comment.getId();
                String replyName = "User";
                if (comment.getUser() != null && comment.getUser().containsKey("name")) {
                    replyName = comment.getUser().get("name");
                }
                etComment.setHint("Replying to @" + replyName);
                etComment.requestFocus();
            }

            @Override
            public void onLike(Comment comment, TextView btnLike, TextView tvLikeCount) {
                apiService.toggleLikeComment(comment.getId()).enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
                    @Override
                    public void onResponse(Call<ApiResponse<Map<String, Object>>> call, Response<ApiResponse<Map<String, Object>>> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            Map<String, Object> data = response.body().getData();
                            if (data != null && data.containsKey("isLiked")) {
                                boolean isLiked = (boolean) data.get("isLiked");
                                int likes = ((Double) data.get("likes")).intValue();
                                btnLike.setText(isLiked ? "❤️" : "🤍");
                                tvLikeCount.setText(String.valueOf(likes));
                            }
                        }
                    }

                    @Override
                    public void onFailure(Call<ApiResponse<Map<String, Object>>> call, Throwable t) {}
                });
            }

            @Override
            public void onProfileClick(String userId) {
                if (userId != null && getContext() != null) {
                    android.content.Intent profileIntent = new android.content.Intent(getContext(), PublicProfileActivity.class);
                    profileIntent.putExtra(PublicProfileActivity.EXTRA_USER_ID, userId);
                    startActivity(profileIntent);
                    dismiss();
                }
            }
        });
        
        rvComments.setAdapter(adapter);

        rvComments.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
                super.onScrolled(recyclerView, dx, dy);
                int visibleItemCount = layoutManager.getChildCount();
                int totalItemCount = layoutManager.getItemCount();
                int firstVisibleItemPosition = layoutManager.findFirstVisibleItemPosition();

                if (!isLoading && hasMorePages) {
                    if ((visibleItemCount + firstVisibleItemPosition) >= totalItemCount - 5) {
                        loadComments();
                    }
                }
            }
        });

        btnSend.setOnClickListener(v -> postComment());

        loadComments();
    }

    private void loadComments() {
        if (isLoading || !hasMorePages) return;
        isLoading = true;

        apiService.getComments(videoId, currentPage, 30).enqueue(new Callback<ApiResponse<List<Comment>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Comment>>> call, Response<ApiResponse<List<Comment>>> response) {
                isLoading = false;
                if (response.isSuccessful() && response.body() != null) {
                    List<Comment> comments = response.body().getData();
                    if (comments != null && !comments.isEmpty()) {
                        if (currentPage == 1) {
                            adapter.setComments(comments);
                            tvCommentCount.setText(String.valueOf(comments.size()));
                        } else {
                            adapter.addComments(comments);
                        }
                        currentPage++;
                    } else {
                        hasMorePages = false;
                    }
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Comment>>> call, Throwable t) {
                isLoading = false;
            }
        });

    }

    private void postComment() {
        String text = etComment.getText().toString().trim();
        if (text.isEmpty()) return;

        Map<String, String> body = new HashMap<>();
        body.put("text", text);
        if (parentCommentId != null) {
            body.put("parentComment", parentCommentId);
        }

        btnSend.setEnabled(false);

        apiService.addComment(videoId, body).enqueue(new Callback<ApiResponse<Comment>>() {
            @Override
            public void onResponse(Call<ApiResponse<Comment>> call, Response<ApiResponse<Comment>> response) {
                btnSend.setEnabled(true);
                if (response.isSuccessful() && response.body() != null) {
                    etComment.setText("");
                    etComment.setHint("Add a comment...");
                    parentCommentId = null;
                    
                    // Reload from page 1 to show the new comment
                    currentPage = 1;
                    hasMorePages = true;
                    loadComments();
                } else {
                    Toast.makeText(getContext(), "Failed to post comment", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Comment>> call, Throwable t) {
                btnSend.setEnabled(true);
                Toast.makeText(getContext(), "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private String decodeUserId(String token) {
        if (token == null) return "";
        try {
            String[] split = token.split("\\.");
            if (split.length == 3) {
                String payload = new String(Base64.decode(split[1], Base64.URL_SAFE));
                JSONObject json = new JSONObject(payload);
                return json.optString("id");
            }
        } catch (Exception e) {}
        return "";
    }
}
