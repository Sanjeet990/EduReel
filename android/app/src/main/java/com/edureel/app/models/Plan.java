package com.edureel.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class Plan {
    @SerializedName("_id")
    private String _id;
    private String name;
    private int durationDays;
    private List<String> features;
    private double price;
    private int numberOfDevices;
    private boolean isActive;

    public String getId() { return _id; }
    public String getName() { return name; }
    public int getDurationDays() { return durationDays; }
    public List<String> getFeatures() { return features; }
    public double getPrice() { return price; }
    public int getNumberOfDevices() { return numberOfDevices; }
    public boolean isActive() { return isActive; }
}
