Feature: Export carousel
  As a carousel builder
  I want to save or share rendered slides
  So that I can post the carousel to Instagram

  Background:
    Given I am on the Framinator builder page

  Scenario: Export disabled before template selection
    Given I have uploaded at least one photo
    And I have not selected a template
    Then the export button should be disabled

  Scenario: Export enabled after template selection
    Given I have uploaded at least one photo
    And I have selected a template
    Then the export button should be enabled

  Scenario: Open export overlay
    Given I have uploaded at least one photo
    And I have selected a template
    When I click export
    Then I should see the export overlay
    And I should see one export card per slide to export
    And each card should render as a 1080px JPEG preview

  Scenario: Per-slide save and share actions
    Given I have opened the export overlay
    And rendered slides are ready
    Then each slide card should offer save and share actions

  Scenario: Download all slides as ZIP
    Given I have opened the export overlay
    And rendered slides are ready
    When I download the ZIP
    Then I should receive a ZIP containing all exported slides

  Scenario: Share all when the browser supports file sharing
    Given my browser supports sharing files
    And I have opened the export overlay with rendered slides
    Then I should see a share-all action

  Scenario: Close export overlay with close control
    Given I have opened the export overlay
    When I click the close control in the export overlay
    Then the export overlay should be closed

  Scenario: Close export overlay with Escape key
    Given I have opened the export overlay
    When I press the Escape key
    Then the export overlay should be closed

  Scenario: Export reflects current customization
    Given I have uploaded at least one photo
    And I have selected a template
    And I have applied a film filter and aspect ratio
    When I export the carousel
    Then exported slides should match the live preview settings
