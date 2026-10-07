package com.plateandpantry.service;

import com.plateandpantry.domain.*;
import com.plateandpantry.dto.OrderDtos.*;
import com.plateandpantry.error.BusinessException;
import com.plateandpantry.repository.CustomerOrderRepository;
import com.plateandpantry.repository.IdempotencyLockRepository;
import com.plateandpantry.repository.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final ProductRepository products;
    private final CustomerOrderRepository orders;
    private final IdempotencyLockRepository idempotencyLocks;
    private final BigDecimal deliveryFee;

    public OrderService(ProductRepository products, CustomerOrderRepository orders, IdempotencyLockRepository idempotencyLocks, @Value("${app.delivery-fee}") BigDecimal deliveryFee) {
        this.products = products;
        this.orders = orders;
        this.idempotencyLocks = idempotencyLocks;
        this.deliveryFee = deliveryFee.setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public CustomerOrder create(CreateOrderRequest request, String idempotencyKey) {
        String key = normalizeKey(idempotencyKey);
        idempotencyLocks.lock(key);
        Optional<CustomerOrder> existing = orders.findByIdempotencyKey(key);
        if (existing.isPresent()) return existing.get();
        if (request.paymentMethod() == PaymentMethod.PAYHERE && (request.email() == null || request.email().isBlank())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "EMAIL_REQUIRED", "Email is required for PayHere checkout.");
        }
        Map<Long, Integer> quantities = new TreeMap<>();
        for (CartItemRequest item : request.items()) quantities.merge(item.productId(), item.quantity(), Integer::sum);
        if (quantities.values().stream().anyMatch(q -> q > 20)) throw new BusinessException(HttpStatus.BAD_REQUEST, "QUANTITY_LIMIT", "A maximum of 20 units is allowed per menu item.");
        List<Product> locked = products.findAllForUpdate(quantities.keySet());
        if (locked.size() != quantities.size()) throw new BusinessException(HttpStatus.BAD_REQUEST, "PRODUCT_NOT_FOUND", "One or more menu items no longer exist.");

        CustomerOrder order = new CustomerOrder();
        order.setReference(newReference());
        order.setAccessToken(randomHex(32));
        order.setIdempotencyKey(key);
        order.setCustomerName(request.customerName().trim());
        order.setPhone(request.phone().trim());
        order.setEmail(blankToNull(request.email()));
        order.setDeliveryAddress(request.deliveryAddress().trim());
        order.setNotes(blankToNull(request.notes()));
        order.setPaymentMethod(request.paymentMethod());
        order.setPaymentStatus(request.paymentMethod() == PaymentMethod.PAYHERE ? PaymentStatus.AWAITING_PAYMENT : PaymentStatus.NOT_APPLICABLE);
        order.setFulfillmentStatus(request.paymentMethod() == PaymentMethod.PAYHERE ? FulfillmentStatus.AWAITING_PAYMENT : FulfillmentStatus.AWAITING_CONFIRMATION);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (Product product : locked) {
            int quantity = quantities.get(product.getId());
            if (!product.isActive() || !product.getCategory().isActive()) throw new BusinessException(HttpStatus.CONFLICT, "PRODUCT_UNAVAILABLE", product.getName() + " is currently unavailable.");
            if (product.getStockQuantity() < quantity) throw new BusinessException(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK", "Only " + product.getStockQuantity() + " of " + product.getName() + " remain.");
            product.setStockQuantity(product.getStockQuantity() - quantity);
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
            OrderItem item = new OrderItem();
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setUnitPrice(product.getPrice().setScale(2, RoundingMode.HALF_UP));
            item.setQuantity(quantity);
            item.setLineTotal(lineTotal);
            order.addItem(item);
            subtotal = subtotal.add(lineTotal);
        }
        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setDeliveryFee(deliveryFee);
        order.setTotal(order.getSubtotal().add(deliveryFee).setScale(2, RoundingMode.HALF_UP));
        return orders.save(order);
    }

    @Transactional(readOnly = true)
    public CustomerOrder findPublic(String reference, String accessToken) {
        return orders.findByReferenceAndAccessToken(reference, accessToken).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order details could not be found."));
    }

    @Transactional
    public void releaseInventory(CustomerOrder order) {
        if (order.isInventoryReleased()) return;
        Map<Long, Integer> quantities = new TreeMap<>();
        for (OrderItem item : order.getItems()) quantities.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        for (Product product : products.findAllForUpdate(quantities.keySet())) product.setStockQuantity(product.getStockQuantity() + quantities.get(product.getId()));
        order.setInventoryReleased(true);
    }

    private String normalizeKey(String key) {
        if (key == null || key.isBlank() || key.length() > 100) throw new BusinessException(HttpStatus.BAD_REQUEST, "IDEMPOTENCY_KEY_REQUIRED", "A valid Idempotency-Key header is required.");
        return key.trim();
    }
    private String newReference() { return "PP-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + randomHex(4).toUpperCase(Locale.ROOT); }
    private String randomHex(int bytes) { byte[] value = new byte[bytes]; RANDOM.nextBytes(value); return HexFormat.of().formatHex(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
