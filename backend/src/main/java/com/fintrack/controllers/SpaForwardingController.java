package com.fintrack.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardingController {

    /**
     * Forwards all non-API and non-static browser requests to index.html
     * so that client-side React Router handles URLs like /dashboard, /credits, /login, etc.
     */
    @GetMapping(value = {
            "/",
            "/{path:^(?!api|actuator)[^\\.]*}",
            "/{segment:^(?!api|actuator)[^\\.]*}/**/{path:[^\\.]*}"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
