package com.plateandpantry.service;

import com.plateandpantry.domain.*;
import com.plateandpantry.dto.OrderDtos.PayHereCheckout;
import com.plateandpantry.error.BusinessException;
import com.plateandpantry.repository.CustomerOrderRepository;
import com.plateandpantry.repository.PaymentAttemptRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayHereService {
    public record CallbackInput(String merchantId, String orderId, String paymentId, String amount, String currency, String statusCode, String signature, String method, String statusMessage) {}
    private final CustomerOrderRepository orders;
    private final PaymentAttemptRepository attempts;
    private final OrderService orderService;
    private final String merchantId;
    private final String merchantSecret;
    private final String checkoutUrl;
    private final String notifyUrl;
    private final String returnUrl;
    private final String cancelUrl;

    public PayHereService(CustomerOrderRepository orders, PaymentAttemptRepository attempts, OrderService orderService,
        @Value("${app.payhere.merchant-id}") String merchantId,
        @Value("${app.payhere.merchant-secret}") String merchantSecret,
        @Value("${app.payhere.checkout-url}") String checkoutUrl,
        @Value("${app.payhere.notify-url}") String notifyUrl,
        @Value("${app.payhere.return-url}") String returnUrl,
        @Value("${app.payhere.cancel-url}") String cancelUrl) {
        this.orders = orders;
        this.attempts = attempts;
        this.orderService = orderService;
        this.merchantId = merchantId;
        this.merchantSecret = merchantSecret;
        this.checkoutUrl = checkoutUrl;
        this.notifyUrl = notifyUrl;
        this.returnUrl = returnUrl;
        this.cancelUrl = cancelUrl;
    }

    public PayHereCheckout checkout(CustomerOrder order) {
        boolean configured = !merchantId.isBlank() && !merchantSecret.isBlank() && notifyUrl.startsWith("https://");
        Map<String, String> fields = new LinkedHashMap<>();
        String[] names = order.getCustomerName().trim().split("\\s+", 2);
        String amount = money(order.getTotal());
        fields.put("merchant_id", merchantId);
        fields.put("return_url", returnUrl + "?reference=" + order.getReference() + "&token=" + order.getAccessToken());
        fields.put("cancel_url", cancelUrl + "?cancelled=" + order.getReference());
        fields.put("notify_url", notifyUrl);
        fields.put("first_name", names[0]);
        fields.put("last_name", names.length > 1 ? names[1] : "Customer");
        fields.put("email", order.getEmail());
        fields.put("phone", order.getPhone());
        fields.put("address", order.getDeliveryAddress());
        fields.put("city", "Colombo");
        fields.put("country", "Sri Lanka");
        fields.put("order_id", order.getReference());
        fields.put("items", "Plate & Pantry order " + order.getReference());
        fields.put("currency", order.getCurrency());
        fields.put("amount", amount);
        if (configured) fields.put("hash", md5(merchantId + order.getReference() + amount + order.getCurrency() + md5(merchantSecret)));
        String message = configured ? null : "Set PayHere merchant credentials and a public HTTPS notification URL before using online payment.";
        return new PayHereCheckout(checkoutUrl, fields, configured, message);
    }

    @Transactional
    public boolean handleCallback(CallbackInput input) {
        requireConfigured();
        if (!merchantId.equals(input.merchantId())) throw invalid("Merchant identity does not match.");
        String expected = md5(input.merchantId() + input.orderId() + input.amount() + input.currency() + input.statusCode() + md5(merchantSecret));
        if (!constantTimeEquals(expected, input.signature())) throw invalid("Payment signature is invalid.");
        CustomerOrder order = orders.findByReference(input.orderId()).orElseThrow(() -> invalid("Order identity is invalid."));
        if (order.getPaymentMethod() != PaymentMethod.PAYHERE) throw invalid("Order does not use PayHere.");
        BigDecimal callbackAmount;
        try { callbackAmount = new BigDecimal(input.amount()).setScale(2, RoundingMode.UNNECESSARY); }
        catch (RuntimeException ex) { throw invalid("Payment amount is invalid."); }
        if (callbackAmount.compareTo(order.getTotal()) != 0) throw invalid("Payment amount does not match the order.");
        if (!order.getCurrency().equals(input.currency())) throw invalid("Payment currency does not match the order.");

        String callbackKey = sha256(nullToEmpty(input.paymentId()) + "|" + input.orderId() + "|" + input.statusCode() + "|" + input.signature());
        if (attempts.existsByCallbackKey(callbackKey)) return false;
        PaymentAttempt attempt = new PaymentAttempt();
        attempt.setOrder(order);
        attempt.setCallbackKey(callbackKey);
        attempt.setProviderPaymentId(blankToNull(input.paymentId()));
        attempt.setStatusCode(input.statusCode());
        attempt.setPaymentMethod(blankToNull(input.method()));
        attempt.setStatusMessage(blankToNull(input.statusMessage()));
        attempts.save(attempt);

        switch (input.statusCode()) {
            case "2" -> {
                if (!order.isInventoryReleased()) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                    if (order.getFulfillmentStatus() == FulfillmentStatus.AWAITING_PAYMENT) order.setFulfillmentStatus(FulfillmentStatus.CONFIRMED);
                }
            }
            case "0" -> order.setPaymentStatus(PaymentStatus.PENDING);
            case "-1" -> fail(order, PaymentStatus.CANCELLED);
            case "-2" -> fail(order, PaymentStatus.FAILED);
            case "-3" -> {
                order.setPaymentStatus(PaymentStatus.CHARGEBACK);
                if (order.getFulfillmentStatus() != FulfillmentStatus.COMPLETED) order.setFulfillmentStatus(FulfillmentStatus.CANCELLED);
            }
            default -> throw invalid("Payment status code is unsupported.");
        }
        return true;
    }

    private void fail(CustomerOrder order, PaymentStatus status) {
        if (order.getPaymentStatus() == PaymentStatus.PAID) return;
        order.setPaymentStatus(status);
        order.setFulfillmentStatus(FulfillmentStatus.CANCELLED);
        orderService.releaseInventory(order);
    }
    private void requireConfigured() {
        if (merchantId.isBlank() || merchantSecret.isBlank()) throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "PAYHERE_NOT_CONFIGURED", "PayHere credentials are not configured.");
    }
    private BusinessException invalid(String message) { return new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_PAYHERE_CALLBACK", message); }
    private boolean constantTimeEquals(String expected, String actual) {
        if (actual == null) return false;
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII), actual.toUpperCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII));
    }
    private String md5(String input) { return digest("MD5", input); }
    private String sha256(String input) { return digest("SHA-256", input); }
    private String digest(String algorithm, String input) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance(algorithm).digest(input.getBytes(StandardCharsets.UTF_8))).toUpperCase(Locale.ROOT); }
        catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
    private String money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP).toPlainString(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String nullToEmpty(String value) { return value == null ? "" : value; }
}
