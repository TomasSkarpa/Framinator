Feature: Instagram profile preview overlay
  As a carousel builder
  I want to preview how my latest post looks on an Instagram profile grid
  So that I can judge the overall feed aesthetic before exporting

  Background:
    Given I am on the Framinator builder page

  Scenario: Profile preview button is hidden before template selection
    Given I have uploaded at least one photo
    And I have not selected a template
    Then I should not see the profile preview button

  Scenario: Profile preview button is hidden with no photos
    Given I have not uploaded any photos
    Then I should not see the profile preview button

  Scenario: Profile preview button appears after template selection
    Given I have uploaded at least one photo
    When I select a template
    Then I should see the profile preview button in the top navigation

  Scenario: Open profile preview overlay from top navigation
    Given I have uploaded at least one photo
    And I have selected a template
    When I click the profile preview button
    Then I should see the profile preview overlay
    And the overlay should show an Instagram profile mockup
    And the first grid tile should show my rendered first slide

  Scenario: Profile preview uses the first uploaded photo as avatar
    Given I have uploaded at least one photo
    And I have selected a template
    When I open the profile preview overlay
    Then the profile avatar should match my first uploaded photo

  Scenario: Close profile preview with back control
    Given I have opened the profile preview overlay
    When I click the back control in the profile preview
    Then the profile preview overlay should be closed

  Scenario: Close profile preview by clicking the backdrop
    Given I have opened the profile preview overlay
    When I click outside the profile preview card
    Then the profile preview overlay should be closed

  Scenario: Close profile preview with Escape key
    Given I have opened the profile preview overlay
    When I press the Escape key
    Then the profile preview overlay should be closed

  Scenario: Profile preview button hidden when all photos are removed
    Given I have uploaded at least one photo
    And I have selected a template
    When I remove all photos
    Then I should not see the profile preview button

  Scenario: Profile preview reflects customization changes
    Given I have uploaded at least one photo
    And I have selected a template
    And I have opened the profile preview overlay
    When I change the filter or border settings
    Then the latest post tile in the profile preview should update to match
