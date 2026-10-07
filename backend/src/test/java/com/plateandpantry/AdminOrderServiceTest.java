package com.plateandpantry;

import com.plateandpantry.domain.CustomerOrder;
import com.plateandpantry.domain.FulfillmentStatus;
import com.plateandpantry.error.BusinessException;
import com.plateandpantry.repository.CustomerOrderRepository;
import com.plateandpantry.repository.ProductRepository;
import com.plateandpantry.service.AdminOrderService;
import com.plateandpantry.service.OrderService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AdminOrderServiceTest {
    @Test void rejectsArbitraryFulfilmentStatusChanges() {
        CustomerOrderRepository orders = mock(CustomerOrderRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        OrderService orderService = mock(OrderService.class);
        CustomerOrder order = new CustomerOrder(); order.setReference("PP-100"); order.setFulfillmentStatus(FulfillmentStatus.COMPLETED);
        when(orders.findByReference("PP-100")).thenReturn(Optional.of(order));
        AdminOrderService service = new AdminOrderService(orders, products, orderService);
        assertThatThrownBy(() -> service.updateStatus("PP-100", FulfillmentStatus.PREPARING)).isInstanceOf(BusinessException.class).hasMessageContaining("cannot move");
        verifyNoInteractions(orderService);
    }
}
