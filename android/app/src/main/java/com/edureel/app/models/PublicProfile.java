package com.edureel.app.models;

import java.util.List;

public class PublicProfile {
    private String _id;
    private String name;
    private String profileImage;
    private int followerCount;
    private int followingCount;
    private boolean isFollowing;
    private List<Video> videos;

    public String getId() { return _id; }
    public String getName() { return name; }
    public String getProfileImage() { return profileImage; }
    public int getFollowerCount() { return followerCount; }
    public int getFollowingCount() { return followingCount; }
    public boolean isFollowing() { return isFollowing; }
    public void setFollowing(boolean following) { isFollowing = following; }
    public List<Video> getVideos() { return videos; }
}
