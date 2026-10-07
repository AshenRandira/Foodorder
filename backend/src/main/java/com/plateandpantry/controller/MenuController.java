package com.plateandpantry.controller;

import com.plateandpantry.dto.MenuDtos.CategoryView;
import com.plateandpantry.dto.MenuDtos.ProductView;
import com.plateandpantry.service.MenuService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/menu")
public class MenuController {
    private final MenuService menu;
    public MenuController(MenuService menu) { this.menu = menu; }
    @GetMapping("/categories") public List<CategoryView> categories() { return menu.categories(); }
    @GetMapping("/products") public List<ProductView> products() { return menu.products(); }
    @GetMapping("/products/{id}") public ProductView product(@PathVariable Long id) { return menu.product(id); }
}
