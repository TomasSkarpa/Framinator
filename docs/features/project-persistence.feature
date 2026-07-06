Feature: Project persistence
  As a returning user
  I want my work saved on this device
  So that I can resume a carousel after closing the tab

  Background:
    Given I am on the Framinator builder page

  Scenario: No resume prompt on a fresh device
    Given I have no saved project on this device
    Then I should not see a resume project prompt

  Scenario: Resume prompt after a saved project exists
    Given I have a saved project on this device
    When I open the Framinator builder page
    Then I should see a resume project prompt

  Scenario: Resume restores the saved project
    Given I have a saved project with photos, template, and customization
    When I choose to resume the project
    Then my photos should appear in the tray
    And my template selection should be restored
    And my slides and customization should be restored

  Scenario: Start fresh discards the saved project
    Given I have a saved project on this device
    When I choose to start fresh
    Then I should see an empty builder
    And the saved project should be cleared from this device

  Scenario: Edits autosave locally
    Given I have uploaded at least one photo
    And I have selected a template
    When I make changes to the project
    Then the project should autosave to this device without sending originals to a server
