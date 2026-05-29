package com.collaborative.studyroom.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * BaseController — Shared controller superclass.
 * Houses shared authentication helpers to eliminate redundant AI-style private helpers.
 */
public abstract class BaseController {

    /**
     * Retrieves the authenticated email from the Spring Security context.
     * Reusable across all secure controller extensions.
     */
    protected String getAuthenticatedEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
