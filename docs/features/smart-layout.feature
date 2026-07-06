Feature: Smart layout
  As a carousel builder
  I want AI to suggest photo order, slides, and subject-aware crops
  So that I can get a strong first layout quickly

  Background:
    Given I am on the Framinator builder page

  # --- Workflow (e2e/smart-layout.spec.ts) ---

  Scenario: Smart layout hidden with fewer than two photos
    Given I have uploaded one photo
    Then I should not see the smart layout button

  Scenario: Smart layout available with two or more photos
    Given I have uploaded at least two photos
    Then I should see the smart layout button

  Scenario: Confirm before sending thumbnails to Gemini
    Given I have uploaded at least two photos
    When I open smart layout
    Then I should see a confirmation that photo thumbnails are sent to Google Gemini
    And originals stay on my device

  Scenario: Apply a smart layout suggestion
    Given I have uploaded at least two photos
    And I have selected the Kodak strip template
    And I have confirmed smart layout
    When the layout suggestion succeeds
    Then photo order and crops should update in the builder
    And I should see an undo layout action

  Scenario: Undo smart layout
    Given I have applied a smart layout suggestion
    When I undo the layout
    Then the project should return to its pre-layout state

  Scenario: Smart layout failure is recoverable
    Given I have uploaded at least two photos
    And smart layout fails
    Then I should see an error message
    And I should be able to retry or close the dialog

  Scenario: Override smart layout crops manually
    Given I have applied smart layout with crop suggestions
    When I adjust crop in the customize panel
    Then I can override the suggested position and zoom

  # --- Subject framing (e2e/smart-layout.spec.ts, mocked Gemini) ---

  Scenario: Smart layout reframes off-center portrait on Kodak strip
    Given I have uploaded at least two photos including an off-center portrait
    And I have selected the Kodak strip template
    When I run smart layout with a crop that pans toward the subject
    Then the active slide crop offset should move toward the subject
    And scale should reflect a tighter frame when suggested

  Scenario: Smart layout request includes template frame context
    Given I have uploaded at least two photos
    And I have selected the Kodak strip template
    When I confirm smart layout
    Then the API request should include the Kodak strip template and slide aspect ratio
