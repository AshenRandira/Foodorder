package com.plateandpantry.controller;

import com.plateandpantry.service.PayHereService;
import com.plateandpantry.service.PayHereService.CallbackInput;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/payhere")
public class PayHereController {
    private final PayHereService payHere;
    public PayHereController(PayHereService payHere) { this.payHere = payHere; }
    @PostMapping(value = "/notify", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public Map<String, Object> notify(
        @RequestParam("merchant_id") String merchantId,
        @RequestParam("order_id") String orderId,
        @RequestParam(value = "payment_id", required = false) String paymentId,
        @RequestParam("payhere_amount") String amount,
        @RequestParam("payhere_currency") String currency,
        @RequestParam("status_code") String statusCode,
        @RequestParam("md5sig") String signature,
        @RequestParam(value = "method", required = false) String method,
        @RequestParam(value = "status_message", required = false) String statusMessage) {
        boolean processed = payHere.handleCallback(new CallbackInput(merchantId, orderId, paymentId, amount, currency, statusCode, signature, method, statusMessage));
        return Map.of("accepted", true, "processed", processed);
    }
}
