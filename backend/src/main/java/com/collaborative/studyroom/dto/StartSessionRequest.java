package com.collaborative.studyroom.dto;

/**
 * StartSessionRequest - payload mapping for starting a study session.
 */
public class StartSessionRequest {
    // Keep extensible if we want to pass a specific session objective later
    private String topic;

    public StartSessionRequest() {}

    public StartSessionRequest(String topic) {
        this.topic = topic;
    }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
}
