package com.plateandpantry.service;

import com.plateandpantry.domain.*;
import com.plateandpantry.dto.AdminDtos.DashboardView;
import com.plateandpantry.dto.AdminDtos.StatusCount;
import com.plateandpantry.dto.OrderDtos.OrderView;
import com.plateandpantry.error.BusinessException;
import com.plateandpantry.repository.CustomerOrderRepository;
import com.plateandpantry.repository.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminOrderService {
    private static final Map<FulfillmentStatus, Set<FulfillmentStatus>> TRANSITIONS = Map.of(
        FulfillmentStatus.AWAITING_PAYMENT, Set.of(FulfillmentStatus.CANCELLED),
        FulfillmentStatus.AWAITING_CONFIRMATION, Set.of(FulfillmentStatus.CONFIRMED, FulfillmentStatus.CANCELLED),
        FulfillmentStatus.CONFIRMED, Set.of(FulfillmentStatus.PREPARING, FulfillmentStatus.CANCELLED),
        FulfillmentStatus.PREPARING, Set.of(FulfillmentStatus.READY, FulfillmentStatus.CANCELLED),
        FulfillmentStatus.READY, Set.of(FulfillmentStatus.OUT_FOR_DELIVERY, FulfillmentStatus.CANCELLED),
        FulfillmentStatus.OUT_FOR_DELIVERY, Set.of(FulfillmentStatus.COMPLETED),
        FulfillmentStatus.COMPLETED, Set.of(),
        FulfillmentStatus.CANCELLED, Set.of()
    );
    private final CustomerOrderRepository orders;
    private final ProductRepository products;
    private final OrderService orderService;
    public AdminOrderService(CustomerOrderRepository orders, ProductRepository products, OrderService orderService) {
        this.orders = orders;
        this.products = products;
        this.orderService = orderService;
    }
    @Transactional(readOnly = true)
    public List<OrderView> list(FulfillmentStatus status, String search) {
        List<CustomerOrder> source = status == null ? orders.findAllByOrderByCreatedAtDesc() : orders.findAllByFulfillmentStatusOrderByCreatedAtDesc(status);
        String term = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        return source.stream().filter(o -> term.isBlank() || o.getReference().toLowerCase(Locale.ROOT).contains(term) || o.getCustomerName().toLowerCase(Locale.ROOT).contains(term) || o.getPhone().contains(term)).map(ViewMapper::order).toList();
    }
    @Transactional
    public OrderView updateStatus(String reference, FulfillmentStatus target) {
        CustomerOrder order = orders.findByReference(reference).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order was not found."));
        if (!TRANSITIONS.getOrDefault(order.getFulfillmentStatus(), Set.of()).contains(target)) {
            throw new BusinessException(HttpStatus.CONFLICT, "INVALID_STATUS_TRANSITION", "Order cannot move from " + order.getFulfillmentStatus() + " to " + target + ".");
        }
        order.setFulfillmentStatus(target);
        if (target == FulfillmentStatus.CANCELLED) orderService.releaseInventory(order);
        return ViewMapper.order(order);
    }
    @Transactional(readOnly = true)
    public DashboardView dashboard() {
        List<CustomerOrder> all = orders.findAll();
        Instant today = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<StatusCount> counts = Arrays.stream(FulfillmentStatus.values()).map(status -> new StatusCount(status, all.stream().filter(o -> o.getFulfillmentStatus() == status).count())).toList();
        long lowStock = products.findAll().stream().filter(Product::isActive).filter(p -> p.getStockQuantity() <= 5).count();
        BigDecimal paid = orders.sumPaidSales();
        BigDecimal paidToday = orders.sumPaidSalesSince(today);
        return new DashboardView(all.size(), orders.countByCreatedAtAfter(today), paid, paidToday, lowStock, counts);
    }
}
