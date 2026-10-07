package com.plateandpantry.controller;

import com.plateandpantry.domain.FulfillmentStatus;
import com.plateandpantry.dto.AdminDtos.*;
import com.plateandpantry.dto.OrderDtos.OrderView;
import com.plateandpantry.service.AdminOrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminOrderController {
    private final AdminOrderService orders;
    public AdminOrderController(AdminOrderService orders) { this.orders = orders; }
    @GetMapping("/dashboard") public DashboardView dashboard() { return orders.dashboard(); }
    @GetMapping("/orders") public List<OrderView> orders(@RequestParam(required = false) FulfillmentStatus status, @RequestParam(required = false) String search) { return orders.list(status, search); }
    @PatchMapping("/orders/{reference}/status") public OrderView status(@PathVariable String reference, @Valid @RequestBody StatusInput input) { return orders.updateStatus(reference, input.status()); }
}
