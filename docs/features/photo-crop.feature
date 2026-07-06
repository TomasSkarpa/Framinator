Feature: Per-photo crop and zoom
  As a carousel builder
  I want to align and zoom each photo in its frame
  So that faces and subjects are framed well before export

  Background:
    Given I am on the Framinator builder page
    And I have uploaded multiple photos
    And I have selected a template

  # --- Shipped: customize panel + slide selection ---

  Scenario: Select a slide to crop its photo
    When I tap a slide thumbnail in the reorder strip
    Then the customize panel should show crop controls for that slide

  Scenario: Customize panel adjusts the selected slide photo
    Given I have selected slide 1 in the carousel
    When I change horizontal, vertical, or zoom in the customize panel
    Then the live preview for slide 1 should update

  Scenario: Reset crop to default from customize panel
    Given I have adjusted crop for the selected slide
    When I reset position in the customize panel
    Then crop should return to the default framing

  Scenario: Smart layout crop is a starting point only
    Given I have applied smart layout with crop suggestions
    When I adjust crop in the customize panel
    Then I can override the suggested position and zoom
    And undo layout should restore the previous crops

  # --- Planned: direct manipulation on preview and tray ---

  @planned
  Scenario: Tap the feed preview to enter crop mode
    When I tap the active slide in the live preview
    Then I should see crop mode for that slide's photo
    And I should see a hint to drag to reposition and pinch or scroll to zoom

  @planned
  Scenario: Drag on preview repositions the photo
    Given I am in crop mode for a slide
    When I drag the photo within the frame
    Then the preview should pan with my drag
    And the customize panel sliders should stay in sync

  @planned
  Scenario: Zoom on preview updates scale
    Given I am in crop mode for a slide
    When I zoom in on the preview
    Then the photo should appear closer in the frame

  @planned
  Scenario: Crop from photo tray thumbnail
    When I open crop from a photo in the tray
    Then I should enter crop mode for that photo
    And the carousel should select a slide that uses that photo if one exists

  # --- Planned: per-placement crop on layered templates ---

  @layered @phase2
  Scenario: Layered template crops are per frame not per photo
    Given I have selected the layered prints template
    And the same photo appears in two frames on one slide
    When I adjust crop for the foreground print
    Then the background use of that photo should keep its own crop

  @layered @phase2
  Scenario: Tap a print layer in layered preview
    Given I have selected a layered prints slide with multiple prints
    When I tap a specific print in the live preview
    Then crop mode should target that frame only

  @layered @phase2
  Scenario: Export uses per-frame crops on layered slides
    Given I have set different crops for two frames using the same photo
    When I export the carousel
    Then each frame in the exported slide should match its preview crop
