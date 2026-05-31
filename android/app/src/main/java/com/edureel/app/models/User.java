package com.edureel.app.models;

public class User {
    private String _id;
    private String name;
    private String email;
    private String role;
    private String token;

    public String getId() { return _id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getToken() { return token; }
}
