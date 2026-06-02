package com.edureel.app.api;

import com.edureel.app.models.ApiResponse;
import com.edureel.app.models.User;
import com.edureel.app.models.UserProfile;
import com.edureel.app.models.Video;
import com.edureel.app.models.Comment;
import com.edureel.app.models.PublicProfile;

import com.edureel.app.models.Metadata;

import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;
import retrofit2.http.Multipart;
import retrofit2.http.Part;
import okhttp3.MultipartBody;

public interface ApiService {
    
    // Auth Routes
    @POST("auth/login")
    Call<ApiResponse<User>> login(@Body Map<String, String> body);

    @POST("auth/register")
    Call<ApiResponse<User>> register(@Body Map<String, String> body);

    @GET("auth/me")
    Call<ApiResponse<Map<String, Object>>> getMe();
    
    @PUT("auth/onboarding")
    Call<ApiResponse<UserProfile>> updateOnboarding(@Body Map<String, Object> body);

    // Video Routes
    @GET("videos/feed")
    Call<ApiResponse<List<Video>>> getFeed(@Query("page") int page, @Query("limit") int limit, @Query("t") long timestamp);

    @GET("videos/explore")
    Call<ApiResponse<List<Video>>> getExplore(@Query("subject") String subject, @Query("classLevel") String classLevel, @Query("limit") Integer limit, @Query("page") Integer page);

    @GET("videos/search")
    Call<ApiResponse<List<Video>>> searchVideos(@Query("q") String query, @Query("limit") Integer limit, @Query("page") Integer page);

    @POST("videos/{id}/view")
    Call<ApiResponse<Void>> viewVideo(@Path("id") String videoId, @Body Map<String, Integer> body);

    @POST("videos/{id}/like")
    Call<ApiResponse<Map<String, Object>>> likeVideo(@Path("id") String videoId);

    @POST("videos/{id}/save")
    Call<ApiResponse<Map<String, Object>>> saveVideo(@Path("id") String videoId);
    
    @GET("videos/{id}/comments")
    Call<ApiResponse<List<Comment>>> getComments(@Path("id") String videoId, @Query("page") int page, @Query("limit") int limit);

    @GET("metadata")
    Call<ApiResponse<Metadata>> getMetadata();

    @POST("videos/{id}/comments")
    Call<ApiResponse<Comment>> addComment(@Path("id") String videoId, @Body Map<String, String> body);

    @POST("comments/{cid}/like")
    Call<ApiResponse<Map<String, Object>>> toggleLikeComment(@Path("cid") String commentId);

    // User Routes
    @GET("users/profile")
    Call<ApiResponse<UserProfile>> getProfile();
    
    @PUT("users/profile")
    Call<ApiResponse<UserProfile>> updateProfile(@Body Map<String, Object> body);

    @Multipart
    @POST("users/profile/image")
    Call<ApiResponse<UserProfile>> uploadAvatar(@Part MultipartBody.Part avatar);
    
    @GET("users/saved")
    Call<ApiResponse<List<Video>>> getSavedVideos(@Query("page") Integer page, @Query("limit") Integer limit);

    @GET("users/history")
    Call<ApiResponse<List<Video>>> getHistory(@Query("page") Integer page, @Query("limit") Integer limit);

    @GET("users/progress")
    Call<ApiResponse<Map<String, Object>>> getProgress();

    // Public Profile
    @GET("users/{id}/public-profile")
    Call<ApiResponse<PublicProfile>> getPublicProfile(@Path("id") String userId);

    @POST("users/{id}/follow")
    Call<ApiResponse<Map<String, Boolean>>> toggleFollow(@Path("id") String userId);

    @GET("users/{id}/following")
    Call<ApiResponse<List<Map<String, String>>>> getFollowing(@Path("id") String userId, @Query("page") int page, @Query("limit") int limit);

    @GET("users/{id}/followers")
    Call<ApiResponse<List<Map<String, String>>>> getFollowers(@Path("id") String userId, @Query("page") int page, @Query("limit") int limit);
}
