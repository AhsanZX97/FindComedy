Feature: Saving favourite nights

  Background:
    Given a night "The Featured Mic" exists

  @critical
  Scenario: Favouriting requires signing in
    Given I am a signed-out visitor
    When I view "The Featured Mic"
    And I try to favourite it
    Then I should be taken to the sign-in page

  @smoke @critical
  Scenario: A favourited night appears in My nights
    Given I am signed in
    And I have favourited "The Featured Mic"
    When I open my nights
    Then I should see "The Featured Mic" in my favourites

  @regression
  Scenario: My nights is empty before favouriting anything
    Given I am signed in
    When I open my nights
    Then I should see a prompt to favourite a night

  @regression
  Scenario: My nights requires signing in
    Given I am a signed-out visitor
    When I open my nights
    Then I should be taken to the sign-in page
