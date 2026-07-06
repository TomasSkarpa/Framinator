Feature: Live carousel preview
  As a carousel builder
  I want an Instagram-style feed preview and slide strip
  So that I can review the carousel before exporting

  Background:
    Given I am on the Framinator builder page
    And I have uploaded at least one photo
    And I have selected a template

  Scenario: Live preview appears after template selection
    Then I should see the live preview section
    And the preview should render at Instagram feed size

  Scenario: Feed mockup uses first photo as avatar
    Then the feed header avatar should use my first uploaded photo

  Scenario: Navigate a multi-slide carousel in the feed mockup
    Given I have more than one slide
    When I go to the next slide in the feed preview
    Then the feed image should show the next slide
    And the slide counter should update

  Scenario: Select a slide from the strip
    Given I have more than one slide
    When I tap a slide thumbnail in the reorder strip
    Then that slide should become active in the feed preview
    And the customize panel should target that slide

  Scenario: Simple templates hint to select slides for cropping
    Given I have selected a simple carousel template
    Then I should see hint text to tap a slide for cropping below

  Scenario: Layered templates hint that photos stay on slides
    Given I have selected a layered template
    Then I should see hint text that photos stay on each slide when reordering
