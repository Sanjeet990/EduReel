package com.edureel.app.models;

import java.util.List;

public class UserProfile {
    private String _id;
    private Object user;
    private String ageGroup;
    private Integer classLevel;
    private List<String> subjects;
    private int xp;
    private int streakDays;
    private List<String> watchedVideos;
    private String profileImage;

    public String getId() { return _id; }
    
    public java.util.Map<String, String> getUser() {
        if (user instanceof java.util.Map) {
            return (java.util.Map<String, String>) user;
        }
        return null;
    }
    
    public String getUserId() {
        if (user instanceof String) {
            return (String) user;
        } else if (user instanceof java.util.Map) {
            return ((java.util.Map<String, String>) user).get("_id");
        }
        return null;
    }
    
    public String getAgeGroup() { return ageGroup; }
    public Integer getClassLevel() { return classLevel; }
    public List<String> getSubjects() { return subjects; }
    public int getXp() { return xp; }
    public int getStreakDays() { return streakDays; }
    public List<String> getWatchedVideos() { return watchedVideos; }
    public String getProfileImage() { return profileImage; }
    
    private List<String> followers;
    private List<String> following;

    public List<String> getFollowers() { return followers; }
    public List<String> getFollowing() { return following; }
}
