package com.fintrack.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardingController {

    /**
     * Forwards all React Single Page Application client-side routes to index.html
     * so that browser reloads work seamlessly without colliding with Spring Boot REST endpoints.
     */
    @GetMapping(value = {
            "/",
            "/login",
            "/dashboard",
            "/credits",
            "/debits",
            "/debts",
            "/statement",
            "/profile",
            "/support"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
