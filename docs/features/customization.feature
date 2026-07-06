Feature: Global and per-slide customization
  As a carousel builder
  I want to tune aspect ratio, film look, and framing
  So that the exported carousel matches my aesthetic

  Background:
    Given I am on the Framinator builder page
    And I have uploaded at least one photo
    And I have selected a template

  Scenario: Customize panel appears after template selection
    Then I should see the customize panel

  Scenario: Change aspect ratio for all slides
    When I switch aspect ratio to square
    Then the live preview should use the square ratio
    And export should target 1080 by 1080 pixels
    When I switch aspect ratio to portrait
    Then the live preview should use the portrait ratio
    And export should target 1080 by 1350 pixels

  Scenario: Apply a film filter to all slides
    When I select a film filter
    Then the live preview should update with that filter
    And exported slides should use the same filter

  Scenario: Polaroid border width control
    Given I have selected the framed polaroid template
    When I adjust the border width
    Then the live preview should show the new border width

  Scenario: Border control hidden on non-polaroid templates
    Given I have selected the clean carousel template
    Then I should not see a border width control
