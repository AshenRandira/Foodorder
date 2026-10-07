package com.plateandpantry.controller;

import com.plateandpantry.domain.CustomerOrder;
import com.plateandpantry.dto.OrderDtos.*;
import com.plateandpantry.service.CheckoutService;
import com.plateandpantry.service.OrderService;
import com.plateandpantry.service.ViewMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orders;
    private final CheckoutService checkout;
    public OrderController(OrderService orders, CheckoutService checkout) { this.orders = orders; this.checkout = checkout; }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse create(@Valid @RequestBody CreateOrderRequest request, @RequestHeader("Idempotency-Key") String key) {
        CustomerOrder order = orders.create(request, key);
        return checkout.response(order);
    }
    @GetMapping("/{reference}")
    public OrderView get(@PathVariable String reference, @RequestParam String token) { return ViewMapper.order(orders.findPublic(reference, token)); }
}
