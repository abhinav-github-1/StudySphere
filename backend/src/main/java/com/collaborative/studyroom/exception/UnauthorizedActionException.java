package com.collaborative.studyroom.exception;

/**
 * UnauthorizedActionException — custom exception indicating a permission violation.
 */
public class UnauthorizedActionException extends RuntimeException {

    public UnauthorizedActionException(String message) {
        super(message);
    }
}
