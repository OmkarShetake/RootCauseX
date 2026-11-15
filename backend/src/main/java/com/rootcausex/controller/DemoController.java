package com.rootcausex.controller;

import com.rootcausex.service.DemoFixtureService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/demo")
public class DemoController {

    private final DemoFixtureService demoFixtureService;

    public DemoController(DemoFixtureService demoFixtureService) {
        this.demoFixtureService = demoFixtureService;
    }

    @PostMapping("/load")
    public ResponseEntity<Map<String, Object>> loadDemoFixtures(
        @RequestParam(defaultValue = "spring-projects") String owner,
        @RequestParam(defaultValue = "spring-petclinic") String repo
    ) {
        Map<String, Object> result = demoFixtureService.loadDemoFixtures(owner, repo);
        return ResponseEntity.ok(result);
    }
}
