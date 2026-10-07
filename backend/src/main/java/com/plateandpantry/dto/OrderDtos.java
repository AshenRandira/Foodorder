package com.plateandpantry.dto;

import com.plateandpantry.domain.FulfillmentStatus;
import com.plateandpantry.domain.PaymentMethod;
import com.plateandpantry.domain.PaymentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class OrderDtos {
    private OrderDtos() {}
    public record CartItemRequest(@NotNull Long productId, @Min(1) @Max(20) int quantity) {}
    public record CreateOrderRequest(
        @NotBlank @Size(max = 120) String customerName,
        @NotBlank @Pattern(regexp = "^[+0-9][0-9\\s-]{8,18}$", message = "must be a valid phone number") String phone,
        @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 8, max = 500) String deliveryAddress,
        @Size(max = 800) String notes,
        @NotNull PaymentMethod paymentMethod,
        @NotEmpty @Size(max = 20) List<@Valid CartItemRequest> items
    ) {}
    public record OrderItemView(Long productId, String productName, BigDecimal unitPrice, int quantity, BigDecimal lineTotal) {}
    public record OrderView(
        String reference,
        String customerName,
        String phone,
        String email,
        String deliveryAddress,
        String notes,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        FulfillmentStatus fulfillmentStatus,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal total,
        String currency,
        List<OrderItemView> items,
        Instant createdAt
    ) {}
    public record PayHereCheckout(String actionUrl, Map<String, String> fields, boolean configured, String configurationMessage) {}
    public record CheckoutResponse(OrderView order, String accessToken, PayHereCheckout payHere, String whatsappUrl) {}
}
