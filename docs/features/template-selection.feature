Feature: Template selection
  As a carousel builder
  I want to pick and change a layout template
  So that my photos are arranged the way I want before customizing

  Background:
    Given I am on the Framinator builder page
    And I have uploaded at least one photo

  Scenario: Template picker appears after upload
    Then I should see the template picker
    And each template card should show a live preview with my photos

  Scenario: Select a template collapses the picker
    When I select a template
    Then the picker should collapse to a summary row with the chosen template
    And I should see a change control to reopen the picker

  Scenario: Reopen picker with Done to collapse again
    Given I have selected a template
    When I reopen the template picker
    And I click Done without changing the template
    Then the picker should collapse back to the summary row

  Scenario: Change template rebuilds slides
    Given I have selected a template
    And I have multiple photos in the tray
    When I change to a different template
    Then slides should be rebuilt for the new template
    And the live preview should appear

  Scenario: Available templates
    Then I should be able to choose from these templates:
      | id                      | name              |
      | framed-polaroid         | Framed polaroid   |
      | clean-carousel          | Clean carousel    |
      | kodak-strip             | Kodak strip       |
      | layered-prints          | Layered prints    |
      | layered-prints-panorama | Panorama spread   |
      | layered-spread-scatter  | Scatter spread    |
      | layered-spread-cascade  | Diagonal cascade  |
      | layered-spread-corner   | Corner bleed      |
      | layered-spread-tilted   | Tilted pile       |
      | layered-spread-split    | Split focus       |
      | soft-focus              | Soft focus        |
