Feature: Browsing by area

  Background:
    Given the listings include a night "Camden Open Mic" in "Camden"

  @regression
  Scenario: The areas index lists areas with nights
    When I open the areas index
    Then I should see "Camden" listed

  @regression
  Scenario: An area page shows only that area's nights
    When I open the "Camden" area page
    Then I should see "Camden Open Mic"
