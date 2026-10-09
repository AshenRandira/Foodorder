package com.plateandpantry.controller;

import com.plateandpantry.service.PayHereService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
public class StoreConfigController {
    public record StoreConfig(boolean payHereAvailable, String payHereMessage) {}

    private final PayHereService payHere;

    public StoreConfigController(PayHereService payHere) {
        this.payHere = payHere;
    }

    @GetMapping
    public StoreConfig get() {
        return new StoreConfig(payHere.configured(), payHere.configured() ? null : payHere.configurationMessage());
    }
}
