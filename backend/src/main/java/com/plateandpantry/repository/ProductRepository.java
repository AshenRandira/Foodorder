package com.plateandpantry.repository;

import com.plateandpantry.domain.Product;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("select p from Product p join fetch p.category where p.active = true and p.category.active = true order by p.featured desc, p.name asc")
    List<Product> findPublicProducts();
    @Query("select p from Product p join fetch p.category where p.id = :id and p.active = true and p.category.active = true")
    Optional<Product> findPublicById(@Param("id") Long id);
    @Query("select p from Product p join fetch p.category order by p.active desc, p.name asc")
    List<Product> findAdminProducts();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id in :ids order by p.id")
    List<Product> findAllForUpdate(@Param("ids") Collection<Long> ids);
    boolean existsBySlugAndIdNot(String slug, Long id);
    boolean existsBySlug(String slug);
}
