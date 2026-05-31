package com.edureel.app.managers;

import java.util.HashSet;
import java.util.Set;

public class FollowManager {
    private static FollowManager instance;
    private Set<String> followingSet = new HashSet<>();
    private Set<String> unfollowedSet = new HashSet<>();

    private FollowManager() {}

    public static synchronized FollowManager getInstance() {
        if (instance == null) {
            instance = new FollowManager();
        }
        return instance;
    }

    public void setFollowing(String userId, boolean isFollowing) {
        if (isFollowing) {
            followingSet.add(userId);
            unfollowedSet.remove(userId);
        } else {
            followingSet.remove(userId);
            unfollowedSet.add(userId);
        }
    }

    public boolean isFollowing(String userId, boolean serverIsFollowing) {
        if (followingSet.contains(userId)) return true;
        if (unfollowedSet.contains(userId)) return false;
        return serverIsFollowing;
    }
    
    public void clear() {
        followingSet.clear();
        unfollowedSet.clear();
    }
}
