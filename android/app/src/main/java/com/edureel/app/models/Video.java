package com.edureel.app.models;

import java.util.List;

public class Video {
    private String _id;
    private String title;
    private String description;
    private String videoUrl;
    private String subject;
    private List<Integer> targetClass;
    private String targetAgeGroup;
    private String hlsUrl;
    private String thumbnailUrl;
    private double durationSeconds;
    private int viewCount;
    private int likeCount;
    private int commentCount;
    private int shareCount;
    
    // Engagement fields added by backend for the current user
    private boolean isLiked;
    private boolean isSaved;
    
    private Uploader uploader;

    public static class Uploader {
        public String _id;
        public String name;
        public String avatar;
        public boolean isFollowing;
    }

    public String getId() { return _id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getVideoUrl() { return videoUrl; }
    public String getSubject() { return subject; }
    public List<Integer> getTargetClass() { return targetClass; }
    public String getTargetAgeGroup() { return targetAgeGroup; }
    public String getHlsUrl() { return hlsUrl; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public double getDurationSeconds() { return durationSeconds; }
    public int getViewCount() { return viewCount; }
    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }
    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }
    public int getShareCount() { return shareCount; }
    
    public boolean isLiked() { return isLiked; }
    public void setLiked(boolean liked) { isLiked = liked; }
    
    public boolean isSaved() { return isSaved; }
    public void setSaved(boolean saved) { isSaved = saved; }
    
    public Uploader getUploader() { return uploader; }
    public void setUploader(Uploader uploader) { this.uploader = uploader; }
}
