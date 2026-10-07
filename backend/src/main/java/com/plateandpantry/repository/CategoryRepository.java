package com.plateandpantry.repository;

import com.plateandpantry.domain.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByActiveTrueOrderBySortOrderAscNameAsc();
    List<Category> findAllByOrderBySortOrderAscNameAsc();
    boolean existsBySlugAndIdNot(String slug, Long id);
    boolean existsBySlug(String slug);
}
