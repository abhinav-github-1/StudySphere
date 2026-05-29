package com.collaborative.studyroom.exception;

/**
 * ResourceNotFoundException — custom exception indicating a missing entity in MongoDB.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resourceName, String identifier) {
        super(String.format("%s was not found with identifier: '%s'", resourceName, identifier));
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
