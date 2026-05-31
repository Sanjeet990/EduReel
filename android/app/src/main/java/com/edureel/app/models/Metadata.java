package com.edureel.app.models;

import java.util.List;

public class Metadata {
    private List<MetadataClass> classes;
    private List<MetadataSubject> subjects;

    public List<MetadataClass> getClasses() { return classes; }
    public List<MetadataSubject> getSubjects() { return subjects; }
}
