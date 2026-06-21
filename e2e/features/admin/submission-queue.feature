@admin
Feature: Reviewing submitted nights

  Background:
    Given I am signed in as an admin
    And a night "The Pending Mic" is awaiting review

  @regression
  Scenario: Admin sees the pending submission queue
    When I open the submission queue
    Then I should see "The Pending Mic" awaiting review

  @regression
  Scenario: Approving a submission publishes it
    Given I am reviewing "The Pending Mic"
    When I approve it
    Then it should be marked approved

  @regression
  Scenario: Rejecting a submission removes it from the queue
    Given I am reviewing "The Pending Mic"
    When I reject it
    Then it should be marked rejected
