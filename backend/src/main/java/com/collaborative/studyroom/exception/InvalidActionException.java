package com.collaborative.studyroom.exception;

/**
 * InvalidActionException — custom exception indicating a constraint or business validation failure.
 */
public class InvalidActionException extends RuntimeException {

    public InvalidActionException(String message) {
        super(message);
    }
}
