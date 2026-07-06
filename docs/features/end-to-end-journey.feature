Feature: End-to-end carousel build
  As a carousel builder
  I want the main processing flow to work in one pass
  So that I can go from photos to export without getting stuck

  Scenario: Happy path from upload to export
    Given I am on the Framinator builder page
    When I add photos via the file picker
    And I select a template
    Then I should see the live preview
    And I should see the customize panel
    When I adjust a film filter and aspect ratio
    Then the live preview should update
    When I export the carousel
    Then I should see rendered JPEG slides ready to save or share

  Scenario: Review feed context before export
    Given I am on the Framinator builder page
    And I have uploaded at least one photo
    And I have selected a template
    When I open the profile preview overlay
    Then the first grid tile should show my rendered first slide
    When I close the profile preview overlay
    And I export the carousel
    Then exported slides should match what I saw in preview
