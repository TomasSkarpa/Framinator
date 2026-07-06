Feature: Layered spread templates
  As a carousel builder
  I want spread-style layered templates to compose multi-print slides
  So that I can build richer carousel layouts

  Background:
    Given I am on the Framinator builder page
    And I have uploaded multiple photos

  # Spread templates: layered-spread-scatter, cascade, corner, tilted, split
  # Plus layered-prints-panorama for two-slide panorama compositions

  Scenario: Panorama spread builds paired slides
    Given I have selected the panorama spread template
    And I have at least three photos in the tray
    Then I should see two slides with panorama roles
    And the spanning print should bridge the left and right slides

  Scenario: Panorama spread grows with more photos
    Given I have selected the panorama spread template
    When I add a fourth photo to the tray
    Then the carousel should grow to four slides

  Scenario: Photo tray order controls fill order on spread templates
    Given I have selected a layered spread template
    When I reorder photos in the tray
    Then photos should reflow into frames according to the new tray order

  Scenario: Slide reorder moves whole slides without reflowing photos
    Given I have layered spread slides with assigned photos
    When I reorder slides in the carousel strip
    Then each slide should keep its assigned photos

  Scenario: Export skips slides with no assigned photos
    Given I have selected a layered spread template
    And some slides have no photos assigned
    When I export the carousel
    Then only slides with at least one photo should be included
