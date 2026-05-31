package com.edureel.app.models;

import java.util.Map;
import java.util.List;

public class Comment {
    private String _id;
    private String text;
    private String video;
    private Map<String, String> user; // contains _id, name, email
    private int likes;
    private String createdAt;
    private List<String> likedBy;
    private String parentComment;

    public String getId() { return _id; }
    public String getText() { return text; }
    public String getVideo() { return video; }
    public Map<String, String> getUser() { return user; }
    public int getLikes() { return likes; }
    public String getCreatedAt() { return createdAt; }
    public List<String> getLikedBy() { return likedBy; }
    public String getParentComment() { return parentComment; }
}
