Feature: Simple carousel templates
  As a carousel builder
  I want one-photo-per-slide templates to follow tray order
  So that a straightforward carousel is quick to build

  Background:
    Given I am on the Framinator builder page
    And I have uploaded multiple photos
    And I have selected a simple carousel template

  # Simple templates: framed-polaroid, clean-carousel, kodak-strip

  Scenario: One slide per photo in tray order
    Then I should see one slide per uploaded photo
    And slide 1 should use the leftmost photo in the tray

  Scenario: Reordering photos reorders slides
    When I reorder photos in the tray
    Then slides should follow the new tray order
    And each slide should keep its identity where possible

  Scenario: Reordering slides changes carousel order only
    When I reorder slides in the carousel strip
    Then the carousel order should match my new slide order
    And each slide should still show its assigned photo

  Scenario: Adding a photo appends a slide
    When I add another photo
    Then a new slide should appear at the end of the carousel

  Scenario: Removing a photo removes its slide
    When I remove a photo from the tray
    Then the slide using that photo should be removed
