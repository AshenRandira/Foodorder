package com.plateandpantry.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    @GetMapping({
        "/menu", "/menu/{id}", "/cart", "/checkout", "/order/return", "/order/{reference}",
        "/admin", "/admin/login", "/admin/orders", "/admin/products", "/admin/categories"
    })
    public String app() {
        return "forward:/index.html";
    }
}
