Feature: Reporting an out-of-date night

  Background:
    Given a night "The Featured Mic" exists

  @critical
  Scenario: Reporting requires signing in
    Given I am a signed-out visitor
    When I view "The Featured Mic"
    And I try to report it
    Then I should be taken to the sign-in page

  @critical
  Scenario: Signed-in visitor reports a wrong time
    Given I am signed in
    And I am viewing "The Featured Mic"
    When I report it as having the wrong time
    Then the report received by the team is for "The Featured Mic"
