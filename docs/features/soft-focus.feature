Feature: Soft focus template
  As a carousel builder
  I want a blurred backdrop behind a sharp framed photo
  So that the subject stands out in the feed

  Background:
    Given I am on the Framinator builder page
    And I have uploaded at least one photo
    And I have selected the soft focus template

  Scenario: Soft focus blurs the backdrop outside the print frame
    Then the live preview should show a sharp subject inside the frame
    And the backdrop outside the frame should appear softer than a clean carousel slide

  Scenario: Switching away from soft focus removes the blur treatment
    Given I am viewing a soft focus slide
    When I change to the clean carousel template
    Then the full-frame preview should appear sharper than the soft focus backdrop
