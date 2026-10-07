package com.plateandpantry;

import com.plateandpantry.domain.*;
import com.plateandpantry.dto.OrderDtos.CartItemRequest;
import com.plateandpantry.dto.OrderDtos.CreateOrderRequest;
import com.plateandpantry.error.BusinessException;
import com.plateandpantry.repository.CustomerOrderRepository;
import com.plateandpantry.repository.IdempotencyLockRepository;
import com.plateandpantry.repository.ProductRepository;
import com.plateandpantry.service.OrderService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock ProductRepository products;
    @Mock CustomerOrderRepository orders;
    @Mock IdempotencyLockRepository idempotencyLocks;
    OrderService service;

    @BeforeEach void setup() { service = new OrderService(products, orders, idempotencyLocks, new BigDecimal("350.00")); }

    @Test void calculatesServerOwnedTotalsAndReservesInventory() {
        Product rice = product(1L, "Ceylon Rice", "1250.00", 10);
        Product tea = product(2L, "Ceylon Tea", "450.00", 10);
        when(orders.findByIdempotencyKey("checkout-1")).thenReturn(Optional.empty());
        when(products.findAllForUpdate(any())).thenReturn(List.of(rice, tea));
        when(orders.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerOrder order = service.create(request(PaymentMethod.WHATSAPP, List.of(new CartItemRequest(1L, 2), new CartItemRequest(2L, 1))), "checkout-1");

        assertThat(order.getSubtotal()).isEqualByComparingTo("2950.00");
        assertThat(order.getDeliveryFee()).isEqualByComparingTo("350.00");
        assertThat(order.getTotal()).isEqualByComparingTo("3300.00");
        assertThat(rice.getStockQuantity()).isEqualTo(8);
        assertThat(tea.getStockQuantity()).isEqualTo(9);
        assertThat(order.getItems()).extracting(OrderItem::getProductName).containsExactly("Ceylon Rice", "Ceylon Tea");
    }

    @Test void rejectsCombinedQuantityAboveLimitBeforeInventoryMutation() {
        CreateOrderRequest request = request(PaymentMethod.WHATSAPP, List.of(new CartItemRequest(1L, 11), new CartItemRequest(1L, 10)));
        when(orders.findByIdempotencyKey("too-many")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create(request, "too-many")).isInstanceOf(BusinessException.class).hasMessageContaining("maximum of 20");
        verify(products, never()).findAllForUpdate(any());
    }

    @Test void rejectsInsufficientStockWhileHoldingProductLock() {
        Product rice = product(1L, "Ceylon Rice", "1250.00", 1);
        when(orders.findByIdempotencyKey("stock-check")).thenReturn(Optional.empty());
        when(products.findAllForUpdate(any())).thenReturn(List.of(rice));
        assertThatThrownBy(() -> service.create(request(PaymentMethod.WHATSAPP, List.of(new CartItemRequest(1L, 2))), "stock-check"))
            .isInstanceOf(BusinessException.class).hasMessageContaining("Only 1");
        assertThat(rice.getStockQuantity()).isEqualTo(1);
        verify(orders, never()).save(any());
    }

    @Test void duplicateCheckoutReturnsExistingOrderWithoutReservingAgain() {
        CustomerOrder existing = new CustomerOrder(); existing.setReference("PP-EXISTING"); existing.setIdempotencyKey("same-key");
        when(orders.findByIdempotencyKey("same-key")).thenReturn(Optional.of(existing));
        CustomerOrder result = service.create(request(PaymentMethod.WHATSAPP, List.of(new CartItemRequest(1L, 1))), "same-key");
        assertThat(result).isSameAs(existing);
        verifyNoInteractions(products);
        verify(idempotencyLocks).lock("same-key");
        verify(orders, never()).save(any());
    }

    private Product product(Long id, String name, String price, int stock) {
        Category category = new Category(); category.setName("Meals"); category.setSlug("meals"); category.setActive(true);
        Product product = new Product(); ReflectionTestUtils.setField(product, "id", id); product.setCategory(category); product.setName(name); product.setSlug(name.toLowerCase().replace(' ', '-')); product.setDescription("Freshly prepared"); product.setPrice(new BigDecimal(price)); product.setImageUrl("https://example.com/image.jpg"); product.setStockQuantity(stock); product.setActive(true);
        return product;
    }
    private CreateOrderRequest request(PaymentMethod method, List<CartItemRequest> items) {
        return new CreateOrderRequest("Nimal Perera", "0771234567", method == PaymentMethod.PAYHERE ? "nimal@example.com" : null, "42 Flower Road, Colombo 07", null, method, items);
    }
}
