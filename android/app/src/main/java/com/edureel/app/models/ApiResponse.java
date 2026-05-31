package com.edureel.app.models;

public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private boolean hasMore;

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public T getData() {
        return data;
    }

    public boolean hasMore() {
        return hasMore;
    }
}
