Feature: Photo import
  As a carousel builder
  I want to add and manage photos in the tray
  So that I can build a carousel from my camera roll

  Background:
    Given I am on the Framinator builder page

  Scenario: Empty state invites upload
    Then I should see an empty photo tray with tap or drop hint
    And I should not see the template picker

  Scenario: Upload photos from file picker
    When I add photos via the file picker
    Then I should see the photo count in the tray header
    And the uploaded thumbnails should appear in the tray

  Scenario: Upload photos by drag and drop
    When I drop image files onto the photo tray
    Then the photos should be added to the tray

  Scenario: Add more photos after the first batch
    Given I have uploaded at least one photo
    When I add more photos
    Then new thumbnails should append to the tray
    And I should still see an add-more control while under the photo limit

  Scenario: Remove a photo from the tray
    Given I have uploaded multiple photos
    When I remove one photo from the tray
    Then the photo count should decrease
    And that thumbnail should no longer appear

  Scenario: Removing the last photo resets the builder
    Given I have uploaded one photo
    And I have selected a template
    When I remove that photo
    Then the photo tray should be empty again
    And the template picker should be hidden
    And the live preview should be hidden

  Scenario: Duplicate filenames are skipped
    Given I have uploaded a photo named "vacation.jpg"
    When I try to add another file also named "vacation.jpg"
    Then I should see a toast that duplicates were skipped
    And the photo count should not increase

  Scenario: Photo limit is enforced
    Given I have uploaded the maximum number of photos allowed per project
    Then I should not see an add-more control
    And attempting to add more photos should show a limit toast

  Scenario: Drag to reorder photos in the tray
    Given I have uploaded at least two photos
    Then I should see hint text about drag to set fill order
    When I reorder photos in the tray
    Then the tray order should match my new arrangement

  Scenario: Identify photos while arranging them
    Given I have uploaded multiple photos
    Then each photo should show its filename
    And the photo being customized should be marked as editing
