package com.plateandpantry.service;

import com.plateandpantry.domain.CustomerOrder;
import com.plateandpantry.domain.OrderItem;
import com.plateandpantry.domain.PaymentMethod;
import com.plateandpantry.dto.OrderDtos.*;
import com.plateandpantry.error.BusinessException;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class CheckoutService {
    private final PayHereService payHere;
    private final String whatsappNumber;
    public CheckoutService(PayHereService payHere, @Value("${app.whatsapp-number}") String whatsappNumber) {
        this.payHere = payHere;
        this.whatsappNumber = whatsappNumber.replaceAll("[^0-9]", "");
    }
    public CheckoutResponse response(CustomerOrder order) {
        PayHereCheckout payment = order.getPaymentMethod() == PaymentMethod.PAYHERE ? payHere.checkout(order) : null;
        String whatsapp = order.getPaymentMethod() == PaymentMethod.WHATSAPP ? whatsappUrl(order) : null;
        return new CheckoutResponse(ViewMapper.order(order), order.getAccessToken(), payment, whatsapp);
    }
    public void ensureAvailable(PaymentMethod paymentMethod) {
        if (paymentMethod == PaymentMethod.PAYHERE && !payHere.configured()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "PAYHERE_NOT_CONFIGURED", payHere.configurationMessage());
        }
    }
    private String whatsappUrl(CustomerOrder order) {
        List<String> lines = new ArrayList<>();
        lines.add("Plate & Pantry order enquiry");
        lines.add("Order: " + order.getReference());
        lines.add("");
        for (OrderItem item : order.getItems()) lines.add(item.getQuantity() + " x " + item.getProductName() + " - LKR " + money(item.getLineTotal()));
        lines.add("");
        lines.add("Subtotal: LKR " + money(order.getSubtotal()));
        lines.add("Delivery: LKR " + money(order.getDeliveryFee()));
        lines.add("Total: LKR " + money(order.getTotal()));
        lines.add("");
        lines.add("Name: " + order.getCustomerName());
        lines.add("Phone: " + order.getPhone());
        lines.add("Address: " + order.getDeliveryAddress());
        if (order.getNotes() != null) lines.add("Notes: " + order.getNotes());
        lines.add("");
        lines.add("Please confirm availability and delivery time. Sending this message does not confirm the order.");
        return "https://wa.me/" + whatsappNumber + "?text=" + URLEncoder.encode(String.join("\n", lines), StandardCharsets.UTF_8).replace("+", "%20");
    }
    private String money(java.math.BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP).toPlainString(); }
}
