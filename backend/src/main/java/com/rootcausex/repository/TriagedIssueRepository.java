package com.rootcausex.repository;

import com.rootcausex.entity.TriagedIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TriagedIssueRepository extends JpaRepository<TriagedIssue, Long>, JpaSpecificationExecutor<TriagedIssue> {

    Optional<TriagedIssue> findByRepoFullNameAndIssueNumber(String repoFullName, Integer issueNumber);

    List<TriagedIssue> findByRepoFullNameOrderByIssueNumberDesc(String repoFullName);

    long countByRepoFullName(String repoFullName);

    long countByRepoFullNameAndDuplicateTrue(String repoFullName);

    long countByRepoFullNameAndGoodFirstIssueTrue(String repoFullName);

    @Query("SELECT t.category, COUNT(t) FROM TriagedIssue t WHERE t.repoFullName = :repoFullName GROUP BY t.category")
    List<Object[]> countGroupByCategory(@Param("repoFullName") String repoFullName);

    @Query("SELECT t.severity, COUNT(t) FROM TriagedIssue t WHERE t.repoFullName = :repoFullName GROUP BY t.severity")
    List<Object[]> countGroupBySeverity(@Param("repoFullName") String repoFullName);

    @Query("SELECT t FROM TriagedIssue t WHERE t.state = :state AND t.severity IN :severities AND t.githubCreatedAt <= :cutoff ORDER BY t.githubCreatedAt ASC")
    List<TriagedIssue> findStaleIssues(
        @Param("state") String state,
        @Param("severities") List<String> severities,
        @Param("cutoff") Instant cutoff
    );
}
