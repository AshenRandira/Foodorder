package com.plateandpantry;

import com.plateandpantry.domain.*;
import com.plateandpantry.dto.OrderDtos.PayHereCheckout;
import com.plateandpantry.error.BusinessException;
import com.plateandpantry.repository.CustomerOrderRepository;
import com.plateandpantry.repository.PaymentAttemptRepository;
import com.plateandpantry.service.OrderService;
import com.plateandpantry.service.PayHereService;
import com.plateandpantry.service.PayHereService.CallbackInput;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PayHereServiceTest {
    CustomerOrderRepository orders = mock(CustomerOrderRepository.class);
    PaymentAttemptRepository attempts = mock(PaymentAttemptRepository.class);
    OrderService orderService = mock(OrderService.class);
    PayHereService service;
    CustomerOrder order;

    @BeforeEach void setup() {
        reset(orders, attempts, orderService);
        service = new PayHereService(orders, attempts, orderService, true, "merchant-1", "secret-1", "https://sandbox.payhere.lk/pay/checkout", "https://api.example.com/api/payments/payhere/notify", "https://app.example.com/order/return", "https://app.example.com/checkout");
        order = new CustomerOrder(); order.setReference("PP-200"); order.setAccessToken("access-token"); order.setCustomerName("Test Customer"); order.setEmail("customer@example.com"); order.setPhone("0771234567"); order.setDeliveryAddress("1 Test Street, Colombo"); order.setPaymentMethod(PaymentMethod.PAYHERE); order.setPaymentStatus(PaymentStatus.AWAITING_PAYMENT); order.setFulfillmentStatus(FulfillmentStatus.AWAITING_PAYMENT); order.setTotal(new BigDecimal("1500.00"));
        when(orders.findByReference("PP-200")).thenReturn(Optional.of(order));
    }

    @Test void createsConfiguredSandboxCheckoutWithVerifiedHashAndRoutes() {
        PayHereCheckout checkout = service.checkout(order);
        assertThat(checkout.configured()).isTrue();
        assertThat(checkout.actionUrl()).isEqualTo("https://sandbox.payhere.lk/pay/checkout");
        assertThat(checkout.fields())
            .containsEntry("merchant_id", "merchant-1")
            .containsEntry("order_id", "PP-200")
            .containsEntry("amount", "1500.00")
            .containsEntry("currency", "LKR")
            .containsEntry("notify_url", "https://api.example.com/api/payments/payhere/notify")
            .containsEntry("return_url", "https://app.example.com/order/return?reference=PP-200&token=access-token")
            .containsEntry("cancel_url", "https://app.example.com/checkout?cancelled=PP-200")
            .containsEntry("hash", md5("merchant-1PP-2001500.00LKR" + md5("secret-1")));
    }

    @Test void disabledIntegrationOmitsHashAndRejectsCallbacks() {
        PayHereService disabled = new PayHereService(orders, attempts, orderService, false, "merchant-1", "secret-1", "https://sandbox.payhere.lk/pay/checkout", "https://api.example.com/api/payments/payhere/notify", "https://app.example.com/order/return", "https://app.example.com/checkout");

        assertThat(disabled.configured()).isFalse();
        assertThat(disabled.checkout(order).fields()).doesNotContainKey("hash");
        assertThatThrownBy(() -> disabled.handleCallback(callback("1500.00", "LKR", "2", "pay-disabled")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("unavailable");
        verifyNoInteractions(attempts);
    }

    @Test void rejectsInvalidSignatureWithoutChangingPaymentState() {
        CallbackInput input = new CallbackInput("merchant-1", "PP-200", "pay-1", "1500.00", "LKR", "2", "BAD", "VISA", "Success");
        assertThatThrownBy(() -> service.handleCallback(input)).isInstanceOf(BusinessException.class).hasMessageContaining("signature");
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.AWAITING_PAYMENT);
        verifyNoInteractions(attempts);
    }

    @Test void rejectsAuthenticatedAmountAndCurrencyMismatches() {
        CallbackInput amount = callback("1400.00", "LKR", "2", "pay-2");
        assertThatThrownBy(() -> service.handleCallback(amount)).isInstanceOf(BusinessException.class).hasMessageContaining("amount");
        CallbackInput currency = callback("1500.00", "USD", "2", "pay-3");
        assertThatThrownBy(() -> service.handleCallback(currency)).isInstanceOf(BusinessException.class).hasMessageContaining("currency");
        verify(attempts, never()).save(any());
    }

    @Test void acceptsSuccessOnlyAfterVerificationAndIgnoresDuplicateCallback() {
        CallbackInput input = callback("1500.00", "LKR", "2", "pay-4");
        when(attempts.existsByCallbackKey(any())).thenReturn(false);
        assertThat(service.handleCallback(input)).isTrue();
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(order.getFulfillmentStatus()).isEqualTo(FulfillmentStatus.CONFIRMED);
        verify(attempts).save(any(PaymentAttempt.class));

        when(attempts.existsByCallbackKey(any())).thenReturn(true);
        assertThat(service.handleCallback(input)).isFalse();
        verify(attempts, times(1)).save(any(PaymentAttempt.class));
    }

    @Test void verifiedCancellationCancelsOrderAndReleasesInventory() {
        when(attempts.existsByCallbackKey(any())).thenReturn(false);
        assertThat(service.handleCallback(callback("1500.00", "LKR", "-1", "pay-cancelled"))).isTrue();
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(order.getFulfillmentStatus()).isEqualTo(FulfillmentStatus.CANCELLED);
        verify(orderService).releaseInventory(order);
    }

    @Test void verifiedFailureCancelsOrderAndReleasesInventory() {
        when(attempts.existsByCallbackKey(any())).thenReturn(false);
        assertThat(service.handleCallback(callback("1500.00", "LKR", "-2", "pay-failed"))).isTrue();
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(order.getFulfillmentStatus()).isEqualTo(FulfillmentStatus.CANCELLED);
        verify(orderService).releaseInventory(order);
    }

    private CallbackInput callback(String amount, String currency, String status, String paymentId) {
        String signature = md5("merchant-1" + "PP-200" + amount + currency + status + md5("secret-1"));
        return new CallbackInput("merchant-1", "PP-200", paymentId, amount, currency, status, signature, "VISA", "Provider status");
    }
    private String md5(String input) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("MD5").digest(input.getBytes(StandardCharsets.UTF_8))).toUpperCase(Locale.ROOT); }
        catch (Exception ex) { throw new IllegalStateException(ex); }
    }
}
