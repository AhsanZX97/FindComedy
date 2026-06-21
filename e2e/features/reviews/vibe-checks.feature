Feature: Leaving a vibe check on a night

  Background:
    Given a night "The Featured Mic" exists

  @critical
  Scenario: Leaving a review requires signing in
    Given I am a signed-out visitor
    When I view "The Featured Mic"
    And I try to leave a vibe check
    Then I should be taken to the sign-in page

  @critical
  Scenario: Signed-in visitor leaves a vibe check
    Given I am signed in
    And I am viewing "The Featured Mic"
    When I leave a vibe check tagged "Friendly host" and "Chill vibe"
    Then my vibe check should appear on the night

  @regression
  Scenario: A review must have at least one tag
    Given I am signed in
    And I am viewing "The Featured Mic"
    When I open the vibe-check form without choosing a tag
    Then I should not be able to save it

  @regression
  Scenario: Aggregate tags summarise the crowd's view
    Given "The Featured Mic" has reviews tagging it "Friendly host" three times
    When I view "The Featured Mic"
    Then "Friendly host" should be shown as a top vibe
