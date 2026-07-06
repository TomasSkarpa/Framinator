Feature: Layered prints template
  As a carousel builder
  I want layered-print slides and photo fill order to behave independently
  So that I can arrange the carousel without reshuffling which photos sit on each slide

  Background:
    Given I am on the Framinator builder page
    And I have uploaded multiple photos
    And I have selected the layered prints template

  Scenario: Template opens with a full recipe of placeholder frames
    Then I should see four slides in the carousel
    And empty frames should appear as dashed placeholders in the preview

  Scenario: Photo tray order controls fill order
    Given I have at least two photos in the tray
    Then I should see hint text about drag to set fill order
    When I reorder photos in the tray
    Then photos should reflow into frames left to right across slides

  Scenario: Slide reorder moves whole slides without reflowing photos
    Given layered prints slides have assigned photos
    When I reorder slides in the carousel strip
    Then each slide should keep its assigned photos
    And I should see hint text that photos stay on each slide

  Scenario: Export skips slides with no assigned photos
    Given some slides have no photos assigned
    When I export the carousel
    Then only slides with at least one photo should be included
